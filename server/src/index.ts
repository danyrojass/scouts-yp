import { env } from './config/env.js';
import { app } from './app.js';
import { PrismaService } from './database/prisma.service.js';
import { logger } from './common/logger/logger.js';

async function main(): Promise<void> {
  const prisma = PrismaService.getInstance();

  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Failed to connect to database', { error });
    process.exit(1);
  }

  const server = app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
    logger.info(`Health: http://localhost:${env.PORT}${env.API_PREFIX}/health`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      await PrismaService.disconnect();
      logger.info('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main();
