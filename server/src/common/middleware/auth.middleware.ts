import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { env } from '../../config/env.js';
import { PrismaService } from '../../database/prisma.service.js';
import { UnauthorizedException } from '../exceptions/unauthorized.exception.js';

interface AccessTokenPayload {
  sub: string;
  email: string;
  role: Role;
  groupId: string | null;
  tokenVersion: number;
}

/**
 * Valida el access token y reconstruye el contexto del usuario desde la base.
 * Se consulta `tokenVersion` para invalidar sesiones cuando cambia el rol,
 * el grupo o el estado del usuario (no hay que esperar al vencimiento del JWT).
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.access_token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new UnauthorizedException('Access token required');
    }

    const payload = jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;

    const user = await PrismaService.getInstance().user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        groupId: true,
        tokenVersion: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid session');
    }

    if (user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException('Session expired, please log in again');
    }

    req.user = {
      sub: user.id,
      email: user.email,
      role: user.role,
      groupId: user.groupId,
      tokenVersion: user.tokenVersion,
    };

    next();
  } catch (err) {
    if (err instanceof UnauthorizedException) {
      next(err);
      return;
    }

    if (err instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedException('Invalid or expired access token'));
      return;
    }

    // Errores de infraestructura (p. ej. DB caída) no son 401.
    next(err);
  }
}
