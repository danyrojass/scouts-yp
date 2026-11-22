import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import { CreateActivityDto } from './dto/create-activity.dto.js';
import { UpdateActivityDto } from './dto/update-activity.dto.js';
import { QueryActivitiesDto } from './dto/query-activities.dto.js';
import { NotFoundException } from '../../common/exceptions/not-found.exception.js';
import { HttpException } from '../../common/exceptions/http.exception.js';
import { PaginatedResult } from '../../common/dto/pagination.dto.js';

export class ActivitiesService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = PrismaService.getInstance();
  }

  async findAll(groupId: string, query: QueryActivitiesDto): Promise<PaginatedResult<any>> {
    const where: Prisma.ActivityWhereInput = { groupId };

    if (query.level) where.level = query.level;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { key: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        skip: query.offset,
        take: query.limit,
        orderBy: { [query.sortBy!]: query.sortOrder },
      }),
      this.prisma.activity.count({ where }),
    ]);

    return { data, total, limit: query.limit!, offset: query.offset! };
  }

  async findById(groupId: string, id: string) {
    const activity = await this.prisma.activity.findFirst({
      where: { id, groupId },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    return activity;
  }

  async create(groupId: string, dto: CreateActivityDto) {
    await this.assertKeyAvailable(groupId, dto.key);

    return this.prisma.activity.create({
      data: {
        name: dto.name,
        key: dto.key,
        level: dto.level,
        points: dto.points,
        description: dto.description ?? null,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        groupId,
      },
    });
  }

  async update(groupId: string, id: string, dto: UpdateActivityDto) {
    const existing = await this.prisma.activity.findFirst({
      where: { id, groupId },
    });

    if (!existing) {
      throw new NotFoundException('Activity not found');
    }

    if (dto.key && dto.key !== existing.key) {
      await this.assertKeyAvailable(groupId, dto.key);
    }

    return this.prisma.activity.update({
      where: { id },
      data: {
        ...dto,
        scheduledAt:
          dto.scheduledAt === undefined
            ? undefined
            : dto.scheduledAt === null
              ? null
              : new Date(dto.scheduledAt),
      },
    });
  }

  async remove(groupId: string, id: string) {
    const existing = await this.prisma.activity.findFirst({
      where: { id, groupId },
    });

    if (!existing) {
      throw new NotFoundException('Activity not found');
    }

    await this.prisma.activity.delete({ where: { id } });
  }

  private async assertKeyAvailable(groupId: string, key: string): Promise<void> {
    const existing = await this.prisma.activity.findFirst({
      where: { key, groupId },
      select: { id: true },
    });

    if (existing) {
      throw new HttpException(409, 'Activity key already exists');
    }
  }
}
