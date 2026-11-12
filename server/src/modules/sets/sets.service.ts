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

  async findAll(organizationId: string, query: QuerySetsDto): Promise<PaginatedResult<any>> {
    const where: Prisma.SetWhereInput = { organizationId };

    if (query.type) where.type = query.type;
    if (query.groupId) where.groupId = query.groupId;
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

  async findById(organizationId: string, id: string) {
    const set = await this.prisma.set.findFirst({
      where: { id, organizationId },
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

  async create(organizationId: string, dto: CreateSetDto) {
    await this.assertGroupInOrganization(organizationId, dto.groupId);

    const set = await this.prisma.set.create({
      data: {
        name: dto.name,
        type: dto.type,
        groupId: dto.groupId,
        organizationId,
      },
    });

    return set;
  }

  async update(organizationId: string, id: string, dto: UpdateSetDto) {
    const existing = await this.prisma.set.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new NotFoundException('Set not found');
    }

    if (dto.groupId) {
      await this.assertGroupInOrganization(organizationId, dto.groupId);
    }

    const set = await this.prisma.set.update({
      where: { id },
      data: dto,
    });

    return set;
  }

  async remove(organizationId: string, id: string) {
    const existing = await this.prisma.set.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new NotFoundException('Set not found');
    }

    await this.prisma.set.delete({ where: { id } });
  }

  /** Un set solo puede pertenecer a un grupo de la misma organización. */
  private async assertGroupInOrganization(organizationId: string, groupId: string) {
    const group = await this.prisma.group.findFirst({
      where: { id: groupId, organizationId },
      select: { id: true },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }
  }
}
