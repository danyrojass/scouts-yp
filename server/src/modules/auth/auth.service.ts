import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import { env } from '../../config/env.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { UnauthorizedException } from '../../common/exceptions/unauthorized.exception.js';
import { NotFoundException } from '../../common/exceptions/not-found.exception.js';
import { HttpException } from '../../common/exceptions/http.exception.js';

export class AuthService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = PrismaService.getInstance();
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new HttpException(409, 'Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const orgName = dto.organizationName || `${dto.name}'s Organization`;
    const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + crypto.randomBytes(4).toString('hex');

    const org = await this.prisma.organization.create({
      data: { name: orgName, slug },
    });

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        type: dto.type ?? 'DIRIGENTE',
        role: 'ADMIN',
        level: dto.level ?? 'JEFE',
        organizationId: org.id,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role, user.organizationId);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
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

    const tokens = await this.generateTokens(user.id, user.email, user.role, user.organizationId);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const tokens = await this.generateTokens(
      stored.user.id,
      stored.user.email,
      stored.user.role,
      stored.user.organizationId,
    );

    return tokens;
  }

  async logout(refreshToken: string) {
    await this.prisma.refreshToken.updateMany({
      where: { token: refreshToken, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.sanitizeUser(user);
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: string,
    organizationId: string,
  ) {
    const accessToken = jwt.sign(
      { sub: userId, email, role, organizationId },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as any },
    );

    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        token: rawRefreshToken,
        userId,
        expiresAt,
      },
    });

    return { accessToken, refreshToken: rawRefreshToken };
  }

  private sanitizeUser(user: any) {
    const { passwordHash, ...rest } = user;
    return rest;
  }
}
