import { Router } from 'express';
import { SetsController } from './sets.controller.js';
import { validateDto } from '../../common/middleware/validate.middleware.js';
import { validateQuery } from '../../common/middleware/validate-query.middleware.js';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { requireTenant } from '../../common/middleware/tenant.middleware.js';
import { requireRole } from '../../common/middleware/roles.guard.js';
import { asyncHandler } from '../../common/middleware/async-handler.js';
import { QuerySetsDto } from './dto/query-sets.dto.js';
import { CreateSetDto } from './dto/create-set.dto.js';
import { UpdateSetDto } from './dto/update-set.dto.js';
import { Role } from '@prisma/client';

const setsRouter = Router();
const controller = new SetsController();

setsRouter.use(authenticate, requireTenant);

setsRouter.get('/', validateQuery(QuerySetsDto), asyncHandler((req, res) => controller.findAll(req, res)));
setsRouter.get('/:id', asyncHandler((req, res) => controller.findById(req, res)));
setsRouter.post('/', requireRole(Role.DIRIGENTE, Role.ADMIN), validateDto(CreateSetDto), asyncHandler((req, res) => controller.create(req, res)));
setsRouter.patch('/:id', requireRole(Role.DIRIGENTE, Role.ADMIN), validateDto(UpdateSetDto), asyncHandler((req, res) => controller.update(req, res)));
setsRouter.delete('/:id', requireRole(Role.ADMIN), asyncHandler((req, res) => controller.remove(req, res)));

export { setsRouter };
