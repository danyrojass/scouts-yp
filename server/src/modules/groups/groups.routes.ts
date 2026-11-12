import { Router } from 'express';
import { GroupsController } from './groups.controller.js';
import { validateDto } from '../../common/middleware/validate.middleware.js';
import { validateQuery } from '../../common/middleware/validate-query.middleware.js';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { requireTenant } from '../../common/middleware/tenant.middleware.js';
import { requireRole } from '../../common/middleware/roles.guard.js';
import { asyncHandler } from '../../common/middleware/async-handler.js';
import { QueryGroupsDto } from './dto/query-groups.dto.js';
import { CreateGroupDto } from './dto/create-group.dto.js';
import { UpdateGroupDto } from './dto/update-group.dto.js';
import { Role } from '@prisma/client';

const groupsRouter = Router();
const controller = new GroupsController();

groupsRouter.use(authenticate, requireTenant);

groupsRouter.get('/', validateQuery(QueryGroupsDto), asyncHandler((req, res) => controller.findAll(req, res)));
groupsRouter.get('/:id', asyncHandler((req, res) => controller.findById(req, res)));
groupsRouter.post('/', requireRole(Role.DIRIGENTE, Role.ADMIN), validateDto(CreateGroupDto), asyncHandler((req, res) => controller.create(req, res)));
groupsRouter.patch('/:id', requireRole(Role.DIRIGENTE, Role.ADMIN), validateDto(UpdateGroupDto), asyncHandler((req, res) => controller.update(req, res)));
groupsRouter.delete('/:id', requireRole(Role.ADMIN), asyncHandler((req, res) => controller.remove(req, res)));

export { groupsRouter };
