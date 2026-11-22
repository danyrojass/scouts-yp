import { Router } from 'express';
import { HealthController } from './health.controller.js';
import { asyncHandler } from '../../common/middleware/async-handler.js';

const healthRouter = Router();
const healthController = new HealthController();

healthRouter.get('/', asyncHandler((req, res) => healthController.check(req, res)));

export { healthRouter };
