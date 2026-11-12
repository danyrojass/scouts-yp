import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';
import { logger } from '../common/logger/logger.js';

export class PrismaService {
  private static instance: PrismaClient;

  private constructor() {}

  static getInstance(): PrismaClient {
    if (!PrismaService.instance) {
      const isProduction = env.NODE_ENV === 'production';

      PrismaService.instance = new PrismaClient({
        log: isProduction
          ? [
              { emit: 'stdout', level: 'warn' },
              { emit: 'stdout', level: 'error' },
            ]
          : [
              { emit: 'event', level: 'query' },
              { emit: 'stdout', level: 'info' },
              { emit: 'stdout', level: 'warn' },
              { emit: 'stdout', level: 'error' },
            ],
      });

      // Sin `params`: llevan hashes de contraseña y refresh tokens.
      if (!isProduction) {
        PrismaService.instance.$on('query' as never, (e: any) => {
          logger.debug(`Prisma Query: ${e.query}`);
        });
      }
    }

    return PrismaService.instance;
  }

  static async disconnect(): Promise<void> {
    if (PrismaService.instance) {
      await PrismaService.instance.$disconnect();
    }
  }
}
