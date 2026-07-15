import bcrypt from 'bcrypt';
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { QueryUsersDto } from './dto/query-users.dto.js';
import { NotFoundException } from '../../common/exceptions/not-found.exception.js';
import { HttpException } from '../../common/exceptions/http.exception.js';
import { PaginatedResult } from '../../common/dto/pagination.dto.js';

export class UsersService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = PrismaService.getInstance();
  }

  async findAll(organizationId: string, query: QueryUsersDto): Promise<PaginatedResult<any>> {
    const where: Prisma.UserWhereInput = {
      organizationId,
    };

    if (query.type) where.type = query.type;
    if (query.level) where.level = query.level;
    if (query.groupId) where.groupId = query.groupId;
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
        select: {
          id: true,
          email: true,
          name: true,
          dateOfBirth: true,
          type: true,
          role: true,
          level: true,
          isActive: true,
          organizationId: true,
          groupId: true,
          setId: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, total, limit: query.limit!, offset: query.offset! };
  }

  async findById(organizationId: string, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, organizationId },
      select: {
        id: true,
        email: true,
        name: true,
        dateOfBirth: true,
        type: true,
        role: true,
        level: true,
        isActive: true,
        organizationId: true,
        groupId: true,
        setId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async create(organizationId: string, dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new HttpException(409, 'Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        type: dto.type ?? 'BENEFICIARIO',
        role: dto.role ?? 'BENEFICIARIO',
        level: dto.level ?? 'LOBATO',
        organizationId,
        groupId: dto.groupId,
        setId: dto.setId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        dateOfBirth: true,
        type: true,
        role: true,
        level: true,
        isActive: true,
        organizationId: true,
        groupId: true,
        setId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async update(organizationId: string, id: string, dto: UpdateUserDto) {
    const existing = await this.prisma.user.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new NotFoundException('User not found');
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        email: true,
        name: true,
        dateOfBirth: true,
        type: true,
        role: true,
        level: true,
        isActive: true,
        organizationId: true,
        groupId: true,
        setId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async remove(organizationId: string, id: string) {
    const existing = await this.prisma.user.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
