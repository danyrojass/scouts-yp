import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { PrismaClient, Prisma, Role, UserType, UserLevel } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import { CreateGroupDto } from './dto/create-group.dto.js';
import { UpdateGroupDto } from './dto/update-group.dto.js';
import { QueryGroupsDto } from './dto/query-groups.dto.js';
import { NotFoundException } from '../../common/exceptions/not-found.exception.js';
import { HttpException } from '../../common/exceptions/http.exception.js';
import { PaginatedResult } from '../../common/dto/pagination.dto.js';

const GROUP_SELECT = {
  id: true,
  name: true,
  number: true,
  city: true,
  slug: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.GroupSelect;

const ADMIN_SELECT = {
  id: true,
  email: true,
  name: true,
  type: true,
  role: true,
  level: true,
  isActive: true,
  groupId: true,
  setId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export class GroupsService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = PrismaService.getInstance();
  }

  /** Grupo del usuario autenticado. */
  async findMe(groupId: string) {
    const group = await this.prisma.group.findFirst({
      where: { id: groupId },
      select: {
        ...GROUP_SELECT,
        _count: { select: { users: true, sets: true, activities: true } },
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return group;
  }

  async updateMe(groupId: string, dto: UpdateGroupDto) {
    const existing = await this.prisma.group.findFirst({ where: { id: groupId } });

    if (!existing) {
      throw new NotFoundException('Group not found');
    }

    return this.prisma.group.update({
      where: { id: groupId },
      data: {
        name: dto.name,
        number: dto.number,
        city: dto.city,
      },
      select: GROUP_SELECT,
    });
  }

  /** Listado global: solo plataforma (SUPER_ADMIN). */
  async findAll(query: QueryGroupsDto): Promise<PaginatedResult<any>> {
    const where: Prisma.GroupWhereInput = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { number: { contains: query.search, mode: 'insensitive' } },
        { city: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.group.findMany({
        where,
        skip: query.offset,
        take: query.limit,
        orderBy: { [query.sortBy!]: query.sortOrder },
        select: {
          ...GROUP_SELECT,
          _count: { select: { users: true, sets: true } },
        },
      }),
      this.prisma.group.count({ where }),
    ]);

    return { data, total, limit: query.limit!, offset: query.offset! };
  }

  async findById(id: string) {
    const group = await this.prisma.group.findUnique({
      where: { id },
      select: {
        ...GROUP_SELECT,
        _count: { select: { users: true, sets: true, activities: true } },
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return group;
  }

  async create(dto: CreateGroupDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.admin.email },
      select: { id: true },
    });

    if (existing) {
      throw new HttpException(409, 'Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.admin.password, 12);

    return this.prisma.$transaction(async (tx) => {
      const group = await tx.group.create({
        data: {
          name: dto.name,
          number: dto.number,
          city: dto.city,
          slug: this.buildSlug(dto.name),
        },
        select: GROUP_SELECT,
      });

      const admin = await tx.user.create({
        data: {
          email: dto.admin.email,
          passwordHash,
          name: dto.admin.name,
          type: UserType.DIRIGENTE,
          role: Role.ADMIN,
          level: UserLevel.JEFE,
          groupId: group.id,
        },
        select: ADMIN_SELECT,
      });

      return { group, admin };
    });
  }

  async update(id: string, dto: UpdateGroupDto) {
    const existing = await this.prisma.group.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Group not found');
    }

    return this.prisma.group.update({
      where: { id },
      data: dto,
      select: GROUP_SELECT,
    });
  }

  /** Baja lógica: los grupos no se borran físicamente. */
  async remove(id: string) {
    const existing = await this.prisma.group.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Group not found');
    }

    await this.prisma.group.update({
      where: { id },
      data: { isActive: false },
    });
  }

  private buildSlug(name: string): string {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    return `${base || 'grupo'}-${crypto.randomBytes(4).toString('hex')}`;
  }
}
