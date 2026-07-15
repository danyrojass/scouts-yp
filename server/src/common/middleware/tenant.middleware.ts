import { Request, Response, NextFunction } from 'express';
import { UnauthorizedException } from '../exceptions/unauthorized.exception.js';

export function requireTenant(req: Request, _res: Response, next: NextFunction): void {
  const organizationId = req.user?.organizationId;

  if (!organizationId) {
    next(new UnauthorizedException('Tenant organization not found'));
    return;
  }

  req.organizationId = organizationId;
  next();
}
