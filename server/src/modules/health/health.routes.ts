import { Router } from 'express';
import { HealthController } from './health.controller.js';

const healthRouter = Router();
const healthController = new HealthController();

healthRouter.get('/', (req, res) => healthController.check(req, res));

export { healthRouter };
