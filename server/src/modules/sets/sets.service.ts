import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import { CreateSetDto } from './dto/create-set.dto.js';
import { UpdateSetDto } from './dto/update-set.dto.js';
import { QuerySetsDto } from './dto/query-sets.dto.js';
import { NotFoundException } from '../../common/exceptions/not-found.exception.js';
import { PaginatedResult } from '../../common/dto/pagination.dto.js';

export class SetsService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = PrismaService.getInstance();
  }

  async findAll(groupId: string, query: QuerySetsDto): Promise<PaginatedResult<any>> {
    const where: Prisma.SetWhereInput = { groupId };

    if (query.type) where.type = query.type;
    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.set.findMany({
        where,
        skip: query.offset,
        take: query.limit,
        orderBy: { [query.sortBy!]: query.sortOrder },
        include: {
          group: { select: { id: true, name: true, number: true } },
          _count: { select: { users: true } },
        },
      }),
      this.prisma.set.count({ where }),
    ]);

    return { data, total, limit: query.limit!, offset: query.offset! };
  }

  async findById(groupId: string, id: string) {
    const set = await this.prisma.set.findFirst({
      where: { id, groupId },
      include: {
        group: { select: { id: true, name: true, number: true, city: true } },
        _count: { select: { users: true } },
      },
    });

    if (!set) {
      throw new NotFoundException('Set not found');
    }

    return set;
  }

  async create(groupId: string, dto: CreateSetDto) {
    return this.prisma.set.create({
      data: {
        name: dto.name,
        type: dto.type,
        groupId,
      },
    });
  }

  async update(groupId: string, id: string, dto: UpdateSetDto) {
    const existing = await this.prisma.set.findFirst({
      where: { id, groupId },
    });

    if (!existing) {
      throw new NotFoundException('Set not found');
    }

    return this.prisma.set.update({
      where: { id },
      data: dto,
    });
  }

  async remove(groupId: string, id: string) {
    const existing = await this.prisma.set.findFirst({
      where: { id, groupId },
    });

    if (!existing) {
      throw new NotFoundException('Set not found');
    }

    await this.prisma.set.delete({ where: { id } });
  }
}
