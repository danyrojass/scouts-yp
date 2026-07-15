import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { UnauthorizedException } from '../exceptions/unauthorized.exception.js';

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.access_token || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    next(new UnauthorizedException('Access token required'));
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as {
      sub: string;
      email: string;
      role: 'BENEFICIARIO' | 'DIRIGENTE' | 'ADMIN';
      organizationId: string;
    };

    req.user = payload;
    next();
  } catch {
    next(new UnauthorizedException('Invalid or expired access token'));
  }
}
