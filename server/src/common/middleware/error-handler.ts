import { Request, Response, NextFunction } from 'express';
import { HttpException } from '../exceptions/http.exception.js';
import { logger } from '../logger/logger.js';
import { env } from '../../config/env.js';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof HttpException) {
    logger.warn(`${err.statusCode} - ${err.message}`, {
      details: err.details,
    });

    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  logger.error(`Unhandled error: ${err.message}`, { stack: err.stack });

  res.status(500).json({
    success: false,
    error: {
      message: env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    },
  });
}
