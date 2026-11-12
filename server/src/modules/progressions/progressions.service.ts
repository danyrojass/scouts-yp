import { PrismaClient, Prisma, Role, UserLevel } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import { CreateProgressionDto } from './dto/create-progression.dto.js';
import { QueryProgressionsDto } from './dto/query-progressions.dto.js';
import { NotFoundException } from '../../common/exceptions/not-found.exception.js';
import { HttpException } from '../../common/exceptions/http.exception.js';
import { PaginatedResult } from '../../common/dto/pagination.dto.js';
import { Actor } from '../../common/types/actor.js';

const LEVEL_RANK: Record<UserLevel, number> = {
  [UserLevel.LOBATO]: 0,
  [UserLevel.SCOUT]: 1,
  [UserLevel.CAMINANTE]: 2,
  [UserLevel.ROVER]: 3,
  [UserLevel.JEFE]: 4,
};

const PROGRESSION_INCLUDE = {
  user: { select: { id: true, name: true, level: true } },
  approvedBy: { select: { id: true, name: true } },
} satisfies Prisma.ProgressionInclude;

export class ProgressionsService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = PrismaService.getInstance();
  }

  async findAll(groupId: string, actor: Actor, query: QueryProgressionsDto): Promise<PaginatedResult<any>> {
    const where: Prisma.ProgressionWhereInput = { groupId };

    // Un beneficiario solo ve sus propias progresiones.
    if (actor.role === Role.BENEFICIARIO) {
      where.userId = actor.id;
    } else if (query.userId) {
      where.userId = query.userId;
    }

    if (query.status === 'pending') where.approvedAt = null;
    if (query.status === 'approved') where.approvedAt = { not: null };

    const [data, total] = await Promise.all([
      this.prisma.progression.findMany({
        where,
        skip: query.offset,
        take: query.limit,
        orderBy: { [query.sortBy!]: query.sortOrder },
        include: PROGRESSION_INCLUDE,
      }),
      this.prisma.progression.count({ where }),
    ]);

    return { data, total, limit: query.limit!, offset: query.offset! };
  }

  async findById(groupId: string, actor: Actor, id: string) {
    const progression = await this.prisma.progression.findFirst({
      where: { id, groupId },
      include: PROGRESSION_INCLUDE,
    });

    if (!progression || (actor.role === Role.BENEFICIARIO && progression.userId !== actor.id)) {
      throw new NotFoundException('Progression not found');
    }

    return progression;
  }

  async create(groupId: string, dto: CreateProgressionDto) {
    const user = await this.prisma.user.findFirst({
      where: { id: dto.userId, groupId, isActive: true },
      select: { id: true, level: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (LEVEL_RANK[dto.toLevel] <= LEVEL_RANK[user.level]) {
      throw new HttpException(400, 'toLevel must be higher than the current level');
    }

    return this.prisma.progression.create({
      data: {
        userId: user.id,
        groupId,
        fromLevel: user.level,
        toLevel: dto.toLevel,
      },
      include: PROGRESSION_INCLUDE,
    });
  }

  async approve(groupId: string, actor: Actor, id: string) {
    const progression = await this.prisma.progression.findFirst({
      where: { id, groupId },
      include: { user: { select: { id: true, level: true } } },
    });

    if (!progression) {
      throw new NotFoundException('Progression not found');
    }

    if (progression.approvedAt) {
      throw new HttpException(409, 'Progression already approved');
    }

    if (progression.user.level !== progression.fromLevel) {
      throw new HttpException(409, 'User level changed since the progression was created');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.progression.update({
        where: { id },
        data: { approvedById: actor.id, approvedAt: new Date() },
        include: PROGRESSION_INCLUDE,
      });

      await tx.user.update({
        where: { id: progression.userId },
        data: { level: progression.toLevel },
      });

      return updated;
    });
  }

  async remove(groupId: string, id: string) {
    const existing = await this.prisma.progression.findFirst({
      where: { id, groupId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Progression not found');
    }

    await this.prisma.progression.delete({ where: { id } });
  }
}
