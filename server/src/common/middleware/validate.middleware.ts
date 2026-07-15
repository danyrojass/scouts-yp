import { Request, Response, NextFunction } from 'express';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { HttpException } from '../exceptions/http.exception.js';

type Constructor<T> = new () => T;

export function validateDto<T extends object>(dtoClass: Constructor<T>) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const dto = plainToInstance(dtoClass, req.body, {
      excludeExtraneousValues: false,
    });

    const errors: ValidationError[] = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      const details = errors.map((e) => ({
        property: e.property,
        constraints: e.constraints,
      }));

      next(new HttpException(400, 'Validation failed', details));
      return;
    }

    req.body = dto;
    next();
  };
}
