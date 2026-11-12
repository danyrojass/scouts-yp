import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { PrismaClient, Role } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import { env } from '../../config/env.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { UnauthorizedException } from '../../common/exceptions/unauthorized.exception.js';
import { NotFoundException } from '../../common/exceptions/not-found.exception.js';
import { HttpException } from '../../common/exceptions/http.exception.js';

interface TokenUser {
  id: string;
  email: string;
  role: Role;
  groupId: string | null;
  tokenVersion: number;
}

export class AuthService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = PrismaService.getInstance();
  }

  /**
   * Registro público: solo permite crear un grupo nuevo. Quien lo crea queda
   * como ADMIN de ese grupo. Los demás miembros los da de alta un dirigente.
   */
  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new HttpException(409, 'Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const slug = this.buildSlug(dto.groupName);

    const { user, group } = await this.prisma.$transaction(async (tx) => {
      const group = await tx.group.create({
        data: {
          name: dto.groupName,
          number: dto.groupNumber,
          city: dto.groupCity,
          slug,
        },
      });

      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          name: dto.name,
          type: dto.type ?? 'DIRIGENTE',
          role: 'ADMIN',
          level: dto.level ?? 'JEFE',
          groupId: group.id,
        },
      });

      return { user, group };
    });

    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      group,
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { group: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    if (user.groupId && (!user.group || !user.group.isActive)) {
      throw new UnauthorizedException('Group is inactive');
    }

    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: { include: { group: true } } },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (!stored.user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    if (stored.user.groupId && (!stored.user.group || !stored.user.group.isActive)) {
      throw new UnauthorizedException('Group is inactive');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.generateTokens(stored.user);
  }

  async logout(refreshToken: string) {
    await this.prisma.refreshToken.updateMany({
      where: { token: refreshToken, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { group: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  private async generateTokens(user: TokenUser) {
    const accessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        groupId: user.groupId,
        tokenVersion: user.tokenVersion,
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as any },
    );

    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        token: rawRefreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    return { accessToken, refreshToken: rawRefreshToken };
  }

  private buildSlug(name: string): string {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    return `${base || 'grupo'}-${crypto.randomBytes(4).toString('hex')}`;
  }

  private sanitizeUser(user: any) {
    const { passwordHash, ...rest } = user;
    return rest;
  }
}
