import { Router } from 'express';
import { Role } from '@prisma/client';
import { ProgressionsController } from './progressions.controller.js';
import { validateDto } from '../../common/middleware/validate.middleware.js';
import { validateQuery } from '../../common/middleware/validate-query.middleware.js';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { requireGroup } from '../../common/middleware/group.middleware.js';
import { requireAtLeast } from '../../common/middleware/roles.guard.js';
import { asyncHandler } from '../../common/middleware/async-handler.js';
import { QueryProgressionsDto } from './dto/query-progressions.dto.js';
import { CreateProgressionDto } from './dto/create-progression.dto.js';

const progressionsRouter = Router();
const controller = new ProgressionsController();

progressionsRouter.use(authenticate, requireGroup);

progressionsRouter.get('/', validateQuery(QueryProgressionsDto), asyncHandler((req, res) => controller.findAll(req, res)));
progressionsRouter.get('/:id', asyncHandler((req, res) => controller.findById(req, res)));
progressionsRouter.post('/', requireAtLeast(Role.DIRIGENTE), validateDto(CreateProgressionDto), asyncHandler((req, res) => controller.create(req, res)));
progressionsRouter.patch('/:id/approve', requireAtLeast(Role.DIRIGENTE), asyncHandler((req, res) => controller.approve(req, res)));
progressionsRouter.delete('/:id', requireAtLeast(Role.ADMIN), asyncHandler((req, res) => controller.remove(req, res)));

export { progressionsRouter };
