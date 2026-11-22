import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import { UnauthorizedException } from '../exceptions/unauthorized.exception.js';
import { ForbiddenException } from '../exceptions/forbidden.exception.js';
import { NotFoundException } from '../exceptions/not-found.exception.js';
import { logger } from '../logger/logger.js';

/**
 * Resuelve el grupo (tenant) del request.
 *
 * - Roles de grupo: el groupId sale SIEMPRE del JWT, nunca del cliente.
 * - SUPER_ADMIN: no tiene grupo propio; debe indicar `X-Group-Id`, que se
 *   valida contra la base y se registra para auditoría.
 */
export async function requireGroup(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    if (user.role === Role.SUPER_ADMIN) {
      const requestedGroupId = req.header('x-group-id');

      if (!requestedGroupId) {
        throw new ForbiddenException('X-Group-Id header is required for platform administrators');
      }

      const group = await PrismaService.getInstance().group.findFirst({
        where: { id: requestedGroupId, isActive: true },
        select: { id: true },
      });

      if (!group) {
        throw new NotFoundException('Group not found');
      }

      req.groupId = group.id;

      logger.info('[audit] super admin group access', {
        actorId: user.sub,
        groupId: group.id,
        method: req.method,
        path: req.originalUrl,
      });

      next();
      return;
    }

    if (!user.groupId) {
      throw new ForbiddenException('User does not belong to a group');
    }

    req.groupId = user.groupId;
    next();
  } catch (err) {
    next(err);
  }
}
