import { Request, Response } from 'express';
import { PrismaService } from '../../database/prisma.service.js';

export class HealthController {
  async check(_req: Request, res: Response): Promise<void> {
    const prisma = PrismaService.getInstance();
    let dbStatus = 'ok';

    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'error';
    }

    res.json({
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: dbStatus,
      },
    });
  }
}
