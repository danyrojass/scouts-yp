import { Router } from 'express';
import { SetsController } from './sets.controller.js';
import { validateDto } from '../../common/middleware/validate.middleware.js';
import { validateQuery } from '../../common/middleware/validate-query.middleware.js';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { requireGroup } from '../../common/middleware/group.middleware.js';
import { requireAtLeast } from '../../common/middleware/roles.guard.js';
import { asyncHandler } from '../../common/middleware/async-handler.js';
import { QuerySetsDto } from './dto/query-sets.dto.js';
import { CreateSetDto } from './dto/create-set.dto.js';
import { UpdateSetDto } from './dto/update-set.dto.js';
import { Role } from '@prisma/client';

const setsRouter = Router();
const controller = new SetsController();

setsRouter.use(authenticate, requireGroup);

setsRouter.get('/', validateQuery(QuerySetsDto), asyncHandler((req, res) => controller.findAll(req, res)));
setsRouter.get('/:id', asyncHandler((req, res) => controller.findById(req, res)));
setsRouter.post('/', requireAtLeast(Role.DIRIGENTE), validateDto(CreateSetDto), asyncHandler((req, res) => controller.create(req, res)));
setsRouter.patch('/:id', requireAtLeast(Role.DIRIGENTE), validateDto(UpdateSetDto), asyncHandler((req, res) => controller.update(req, res)));
setsRouter.delete('/:id', requireAtLeast(Role.ADMIN), asyncHandler((req, res) => controller.remove(req, res)));

export { setsRouter };
