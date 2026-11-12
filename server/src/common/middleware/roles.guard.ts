import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { ForbiddenException } from '../exceptions/forbidden.exception.js';

const ROLE_RANK: Record<Role, number> = {
  [Role.BENEFICIARIO]: 0,
  [Role.DIRIGENTE]: 1,
  [Role.ADMIN]: 2,
  [Role.SUPER_ADMIN]: 3,
};

export function hasAtLeast(role: Role, minimum: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

/** Exige que el rol del usuario esté exactamente entre los permitidos. */
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

/** Exige un nivel mínimo dentro de la jerarquía de roles. */
export function requireAtLeast(minimum: Role) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ForbiddenException('Authentication required'));
      return;
    }

    if (!hasAtLeast(req.user.role, minimum)) {
      next(new ForbiddenException('Insufficient permissions'));
      return;
    }

    next();
  };
}
