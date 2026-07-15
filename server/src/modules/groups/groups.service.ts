import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import { CreateGroupDto } from './dto/create-group.dto.js';
import { UpdateGroupDto } from './dto/update-group.dto.js';
import { QueryGroupsDto } from './dto/query-groups.dto.js';
import { NotFoundException } from '../../common/exceptions/not-found.exception.js';
import { PaginatedResult } from '../../common/dto/pagination.dto.js';

export class GroupsService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = PrismaService.getInstance();
  }

  async findAll(organizationId: string, query: QueryGroupsDto): Promise<PaginatedResult<any>> {
    const where: Prisma.GroupWhereInput = { organizationId };

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
        include: { _count: { select: { users: true, sets: true } } },
      }),
      this.prisma.group.count({ where }),
    ]);

    return { data, total, limit: query.limit!, offset: query.offset! };
  }

  async findById(organizationId: string, id: string) {
    const group = await this.prisma.group.findFirst({
      where: { id, organizationId },
      include: {
        _count: { select: { users: true, sets: true } },
        sets: { select: { id: true, name: true, type: true } },
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return group;
  }

  async create(organizationId: string, dto: CreateGroupDto) {
    const group = await this.prisma.group.create({
      data: {
        name: dto.name,
        number: dto.number,
        city: dto.city,
        organizationId,
      },
    });

    return group;
  }

  async update(organizationId: string, id: string, dto: UpdateGroupDto) {
    const existing = await this.prisma.group.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new NotFoundException('Group not found');
    }

    const group = await this.prisma.group.update({
      where: { id },
      data: dto,
    });

    return group;
  }

  async remove(organizationId: string, id: string) {
    const existing = await this.prisma.group.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new NotFoundException('Group not found');
    }

    await this.prisma.group.delete({ where: { id } });
  }
}
