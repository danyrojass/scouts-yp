import 'reflect-metadata';
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { requestLogger } from './common/middleware/logger.middleware.js';
import { errorHandler } from './common/middleware/error-handler.js';
import { healthRouter } from './modules/health/health.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { usersRouter } from './modules/users/users.routes.js';
import { groupsRouter } from './modules/groups/groups.routes.js';
import { setsRouter } from './modules/sets/sets.routes.js';
import { activitiesRouter } from './modules/activities/activities.routes.js';
import { completionsRouter } from './modules/completions/completions.routes.js';
import { paymentsRouter } from './modules/payments/payments.routes.js';
import { progressionsRouter } from './modules/progressions/progressions.routes.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(requestLogger);

app.use(`${env.API_PREFIX}/health`, healthRouter);
app.use(`${env.API_PREFIX}/auth`, authRouter);
app.use(`${env.API_PREFIX}/users`, usersRouter);
app.use(`${env.API_PREFIX}/groups`, groupsRouter);
app.use(`${env.API_PREFIX}/sets`, setsRouter);
app.use(`${env.API_PREFIX}/activities`, activitiesRouter);
app.use(`${env.API_PREFIX}/completions`, completionsRouter);
app.use(`${env.API_PREFIX}/payments`, paymentsRouter);
app.use(`${env.API_PREFIX}/progressions`, progressionsRouter);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: { message: 'Route not found' } });
});

app.use(errorHandler);

export { app };
