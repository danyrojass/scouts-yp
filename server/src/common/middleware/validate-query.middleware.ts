import { Request, Response, NextFunction } from 'express';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { HttpException } from '../exceptions/http.exception.js';

type Constructor<T> = new () => T;

export function validateQuery<T extends object>(dtoClass: Constructor<T>) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const dto = plainToInstance(dtoClass, req.query, {
      excludeExtraneousValues: false,
    });

    const errors: ValidationError[] = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: false,
    });

    if (errors.length > 0) {
      const details = errors.map((e) => ({
        property: e.property,
        constraints: e.constraints,
      }));

      next(new HttpException(400, 'Invalid query parameters', details));
      return;
    }

    req.query = dto as any;
    next();
  };
}
