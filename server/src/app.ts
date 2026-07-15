import 'reflect-metadata';
import express from 'express';
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

app.use(errorHandler);

export { app };
