import bcrypt from 'bcrypt';
import { PrismaClient, Prisma, Role, UserLevel, UserType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { QueryUsersDto } from './dto/query-users.dto.js';
import { NotFoundException } from '../../common/exceptions/not-found.exception.js';
import { ForbiddenException } from '../../common/exceptions/forbidden.exception.js';
import { HttpException } from '../../common/exceptions/http.exception.js';
import { PaginatedResult } from '../../common/dto/pagination.dto.js';
import { Actor } from '../../common/types/actor.js';
import { hasAtLeast } from '../../common/middleware/roles.guard.js';

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  dateOfBirth: true,
  type: true,
  role: true,
  level: true,
  isActive: true,
  groupId: true,
  setId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export class UsersService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = PrismaService.getInstance();
  }

  async findAll(groupId: string, query: QueryUsersDto): Promise<PaginatedResult<any>> {
    const where: Prisma.UserWhereInput = { groupId };

    if (query.type) where.type = query.type;
    if (query.level) where.level = query.level;
    if (query.setId) where.setId = query.setId;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: query.offset,
        take: query.limit,
        orderBy: { [query.sortBy!]: query.sortOrder },
        select: USER_SELECT,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, total, limit: query.limit!, offset: query.offset! };
  }

  async findById(groupId: string, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, groupId },
      select: USER_SELECT,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async create(groupId: string, actor: Actor, dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new HttpException(409, 'Email already registered');
    }

    this.assertCanAssignRole(actor, dto.role);

    const type = dto.type ?? UserType.BENEFICIARIO;
    const set = dto.setId ? await this.findSetInGroup(groupId, dto.setId) : null;

    if (set && type === UserType.DIRIGENTE) {
      throw new HttpException(400, 'Leaders cannot belong to a section');
    }

    if (type === UserType.DIRIGENTE && dto.level !== undefined && dto.level !== UserLevel.JEFE) {
      throw new HttpException(400, 'Leaders must have the leaders level');
    }

    if (set && dto.level && dto.level !== set.level) {
      throw new HttpException(400, 'User level must match the section level');
    }

    const level = set
      ? set.level
      : type === UserType.DIRIGENTE
        ? UserLevel.JEFE
        : dto.level ?? UserLevel.LOBATO;

    const passwordHash = await bcrypt.hash(dto.password, 12);

    return this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        type,
        role: dto.role ?? 'BENEFICIARIO',
        level,
        groupId,
        setId: set?.id ?? null,
      },
      select: USER_SELECT,
    });
  }

  async update(groupId: string, actor: Actor, id: string, dto: UpdateUserDto) {
    const existing = await this.prisma.user.findFirst({
      where: { id, groupId },
    });

    if (!existing) {
      throw new NotFoundException('User not found');
    }

    if (dto.role === Role.SUPER_ADMIN) {
      throw new ForbiddenException('Cannot assign the platform administrator role');
    }

    if (!hasAtLeast(actor.role, Role.ADMIN)) {
      if (existing.role === Role.ADMIN || dto.role === Role.ADMIN) {
        throw new ForbiddenException('Only an administrator can manage administrators');
      }
    }

    const type = dto.type ?? existing.type;
    const targetSetId = dto.setId !== undefined ? dto.setId : existing.setId;
    let level = dto.level ?? existing.level;

    // Un dirigente siempre está en el nivel de dirigencia.
    if (type === UserType.DIRIGENTE) {
      if (dto.level !== undefined && dto.level !== UserLevel.JEFE) {
        throw new HttpException(400, 'Leaders must have the leaders level');
      }
      level = UserLevel.JEFE;
    }

    if (targetSetId) {
      const set = await this.findSetInGroup(groupId, targetSetId);

      if (type === UserType.DIRIGENTE) {
        throw new HttpException(400, 'Leaders cannot belong to a section');
      }

      if (dto.level !== undefined && dto.level !== set.level) {
        throw new HttpException(400, 'User level must match the section level');
      }

      // La sección es la fuente de verdad del nivel.
      level = set.level;
    }

    const adminIsLosingRole = existing.role === Role.ADMIN && dto.role !== undefined && dto.role !== Role.ADMIN;
    const adminIsDeactivated = existing.role === Role.ADMIN && dto.isActive === false;

    if (adminIsLosingRole || adminIsDeactivated) {
      await this.assertNotLastAdmin(groupId, id);
    }

    const data: Prisma.UserUncheckedUpdateInput = {
      ...dto,
      type,
      level,
      setId: targetSetId,
    };
    const invalidateSessions = dto.role !== undefined || dto.isActive !== undefined;

    if (invalidateSessions) {
      data.tokenVersion = { increment: 1 };
    }

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data,
        select: USER_SELECT,
      });

      if (invalidateSessions) {
        await tx.refreshToken.updateMany({
          where: { userId: id, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }

      return user;
    });
  }

  async remove(groupId: string, id: string) {
    const existing = await this.prisma.user.findFirst({
      where: { id, groupId },
    });

    if (!existing) {
      throw new NotFoundException('User not found');
    }

    if (existing.role === Role.ADMIN) {
      await this.assertNotLastAdmin(groupId, id);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          isActive: false,
          tokenVersion: { increment: 1 },
        },
      });

      await tx.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });
  }

  private assertCanAssignRole(actor: Actor, role?: Role): void {
    if (!role) return;

    if (role === Role.SUPER_ADMIN) {
      throw new ForbiddenException('Cannot assign the platform administrator role');
    }

    if (role === Role.ADMIN && !hasAtLeast(actor.role, Role.ADMIN)) {
      throw new ForbiddenException('Only an administrator can create administrators');
    }
  }

  private async findSetInGroup(groupId: string, setId: string): Promise<{ id: string; level: UserLevel }> {
    const set = await this.prisma.set.findFirst({
      where: { id: setId, groupId },
      select: { id: true, level: true },
    });

    if (!set) {
      throw new NotFoundException('Set not found');
    }

    return set;
  }

  private async assertNotLastAdmin(groupId: string, excludeUserId: string): Promise<void> {
    const remainingAdmins = await this.prisma.user.count({
      where: {
        groupId,
        role: Role.ADMIN,
        isActive: true,
        id: { not: excludeUserId },
      },
    });

    if (remainingAdmins === 0) {
      throw new HttpException(409, 'The group must keep at least one active administrator');
    }
  }
}
