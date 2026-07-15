import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { ForbiddenException } from '../exceptions/forbidden.exception.js';

export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ForbiddenException('Authentication required'));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new ForbiddenException('Insufficient permissions'));
      return;
    }

    next();
  };
}
