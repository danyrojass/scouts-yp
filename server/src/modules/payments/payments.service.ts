import { PrismaClient, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { QueryPaymentsDto } from './dto/query-payments.dto.js';
import { NotFoundException } from '../../common/exceptions/not-found.exception.js';
import { PaginatedResult } from '../../common/dto/pagination.dto.js';
import { Actor } from '../../common/types/actor.js';

export class PaymentsService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = PrismaService.getInstance();
  }

  async findAll(groupId: string, actor: Actor, query: QueryPaymentsDto): Promise<PaginatedResult<any>> {
    const where: Prisma.PaymentWhereInput = { groupId };

    // Un beneficiario solo ve sus propios pagos; el resto ve todo el grupo.
    if (actor.role === Role.BENEFICIARIO) {
      where.userId = actor.id;
    } else if (query.userId) {
      where.userId = query.userId;
    }

    if (query.search) {
      where.concept = { contains: query.search, mode: 'insensitive' };
    }

    if (query.from || query.to) {
      where.paidAt = {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to ? { lte: new Date(query.to) } : {}),
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip: query.offset,
        take: query.limit,
        orderBy: { [query.sortBy!]: query.sortOrder },
        include: {
          user: { select: { id: true, name: true } },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return { data, total, limit: query.limit!, offset: query.offset! };
  }

  async findById(groupId: string, actor: Actor, id: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, groupId },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    if (!payment || (actor.role === Role.BENEFICIARIO && payment.userId !== actor.id)) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async create(groupId: string, dto: CreatePaymentDto) {
    const user = await this.prisma.user.findFirst({
      where: { id: dto.userId, groupId, isActive: true },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.payment.create({
      data: {
        userId: user.id,
        groupId,
        amount: dto.amount,
        currency: dto.currency ?? 'ARS',
        concept: dto.concept,
        paidAt: dto.paidAt ? new Date(dto.paidAt) : undefined,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });
  }

  async remove(groupId: string, id: string) {
    const existing = await this.prisma.payment.findFirst({
      where: { id, groupId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Payment not found');
    }

    await this.prisma.payment.delete({ where: { id } });
  }
}
