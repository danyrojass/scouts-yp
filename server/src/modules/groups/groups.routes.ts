import { Router } from 'express';
import { GroupsController } from './groups.controller.js';
import { validateDto } from '../../common/middleware/validate.middleware.js';
import { validateQuery } from '../../common/middleware/validate-query.middleware.js';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { requireGroup } from '../../common/middleware/group.middleware.js';
import { requireAtLeast, requireRole } from '../../common/middleware/roles.guard.js';
import { asyncHandler } from '../../common/middleware/async-handler.js';
import { QueryGroupsDto } from './dto/query-groups.dto.js';
import { CreateGroupDto } from './dto/create-group.dto.js';
import { UpdateGroupDto } from './dto/update-group.dto.js';
import { Role } from '@prisma/client';

const groupsRouter = Router();
const controller = new GroupsController();

groupsRouter.use(authenticate);

// Grupo propio (tenant del JWT)
groupsRouter.get('/me', requireGroup, requireAtLeast(Role.ADMIN), asyncHandler((req, res) => controller.findMe(req, res)));
groupsRouter.patch('/me', requireGroup, requireAtLeast(Role.ADMIN), validateDto(UpdateGroupDto), asyncHandler((req, res) => controller.updateMe(req, res)));

// Plataforma (SUPER_ADMIN)
groupsRouter.get('/', requireRole(Role.SUPER_ADMIN), validateQuery(QueryGroupsDto), asyncHandler((req, res) => controller.findAll(req, res)));
groupsRouter.post('/', requireRole(Role.SUPER_ADMIN), validateDto(CreateGroupDto), asyncHandler((req, res) => controller.create(req, res)));
groupsRouter.get('/:id', requireRole(Role.SUPER_ADMIN), asyncHandler((req, res) => controller.findById(req, res)));
groupsRouter.patch('/:id', requireRole(Role.SUPER_ADMIN), validateDto(UpdateGroupDto), asyncHandler((req, res) => controller.update(req, res)));
groupsRouter.delete('/:id', requireRole(Role.SUPER_ADMIN), asyncHandler((req, res) => controller.remove(req, res)));

export { groupsRouter };
