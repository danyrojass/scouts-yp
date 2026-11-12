import { Router } from 'express';
import { Role } from '@prisma/client';
import { ActivitiesController } from './activities.controller.js';
import { validateDto } from '../../common/middleware/validate.middleware.js';
import { validateQuery } from '../../common/middleware/validate-query.middleware.js';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { requireGroup } from '../../common/middleware/group.middleware.js';
import { requireAtLeast } from '../../common/middleware/roles.guard.js';
import { asyncHandler } from '../../common/middleware/async-handler.js';
import { QueryActivitiesDto } from './dto/query-activities.dto.js';
import { CreateActivityDto } from './dto/create-activity.dto.js';
import { UpdateActivityDto } from './dto/update-activity.dto.js';

const activitiesRouter = Router();
const controller = new ActivitiesController();

activitiesRouter.use(authenticate, requireGroup);

activitiesRouter.get('/', validateQuery(QueryActivitiesDto), asyncHandler((req, res) => controller.findAll(req, res)));
activitiesRouter.get('/:id', asyncHandler((req, res) => controller.findById(req, res)));
activitiesRouter.post('/', requireAtLeast(Role.DIRIGENTE), validateDto(CreateActivityDto), asyncHandler((req, res) => controller.create(req, res)));
activitiesRouter.patch('/:id', requireAtLeast(Role.DIRIGENTE), validateDto(UpdateActivityDto), asyncHandler((req, res) => controller.update(req, res)));
activitiesRouter.delete('/:id', requireAtLeast(Role.ADMIN), asyncHandler((req, res) => controller.remove(req, res)));

export { activitiesRouter };
