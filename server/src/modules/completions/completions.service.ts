import { PrismaClient, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import { CreateCompletionDto } from './dto/create-completion.dto.js';
import { QueryCompletionsDto } from './dto/query-completions.dto.js';
import { NotFoundException } from '../../common/exceptions/not-found.exception.js';
import { ForbiddenException } from '../../common/exceptions/forbidden.exception.js';
import { HttpException } from '../../common/exceptions/http.exception.js';
import { PaginatedResult } from '../../common/dto/pagination.dto.js';
import { Actor } from '../../common/types/actor.js';

export class CompletionsService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = PrismaService.getInstance();
  }

  async findAll(groupId: string, query: QueryCompletionsDto): Promise<PaginatedResult<any>> {
    const where: Prisma.ActivityCompletionWhereInput = { groupId };

    if (query.activityId) where.activityId = query.activityId;
    if (query.userId) where.userId = query.userId;
    if (query.setId) where.setId = query.setId;

    const [data, total] = await Promise.all([
      this.prisma.activityCompletion.findMany({
        where,
        skip: query.offset,
        take: query.limit,
        orderBy: { [query.sortBy!]: query.sortOrder },
        include: {
          activity: { select: { id: true, name: true, key: true, level: true, points: true } },
          user: { select: { id: true, name: true } },
          set: { select: { id: true, name: true, level: true } },
        },
      }),
      this.prisma.activityCompletion.count({ where }),
    ]);

    return { data, total, limit: query.limit!, offset: query.offset! };
  }

  async create(groupId: string, actor: Actor, dto: CreateCompletionDto) {
    const activity = await this.prisma.activity.findFirst({
      where: { id: dto.activityId, groupId },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    const userId = dto.userId ?? actor.id;

    if (actor.role === Role.BENEFICIARIO && userId !== actor.id) {
      throw new ForbiddenException('Beneficiaries can only register their own completions');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: userId, groupId, isActive: true },
      select: { id: true, setId: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (actor.role === Role.BENEFICIARIO && dto.setId && dto.setId !== user.setId) {
      throw new ForbiddenException('Beneficiaries can only register completions for their own set');
    }

    const setId = actor.role === Role.BENEFICIARIO ? user.setId : (dto.setId ?? null);

    if (setId) {
      const set = await this.prisma.set.findFirst({
        where: { id: setId, groupId },
        select: { id: true, level: true },
      });

      if (!set) {
        throw new NotFoundException('Set not found');
      }

      if (set.level !== activity.level) {
        throw new HttpException(400, 'The section level does not match the activity level');
      }
    }

    const earnedPoints = dto.earnedPoints ?? activity.points;

    if (earnedPoints > activity.points) {
      throw new HttpException(400, 'earnedPoints cannot exceed the activity points');
    }

    const existing = await this.prisma.activityCompletion.findFirst({
      where: { activityId: activity.id, userId },
      select: { id: true },
    });

    if (existing) {
      throw new HttpException(409, 'Activity already completed by this user');
    }

    return this.prisma.activityCompletion.create({
      data: {
        activityId: activity.id,
        userId,
        setId,
        groupId,
        earnedPoints,
        completedAt: dto.completedAt ? new Date(dto.completedAt) : undefined,
      },
      include: {
        activity: { select: { id: true, name: true, key: true } },
        user: { select: { id: true, name: true } },
        set: { select: { id: true, name: true, level: true } },
      },
    });
  }
}
