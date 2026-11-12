import { Router } from 'express';
import { UsersController } from './users.controller.js';
import { validateDto } from '../../common/middleware/validate.middleware.js';
import { validateQuery } from '../../common/middleware/validate-query.middleware.js';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { requireTenant } from '../../common/middleware/tenant.middleware.js';
import { requireRole } from '../../common/middleware/roles.guard.js';
import { asyncHandler } from '../../common/middleware/async-handler.js';
import { QueryUsersDto } from './dto/query-users.dto.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { Role } from '@prisma/client';

const usersRouter = Router();
const controller = new UsersController();

usersRouter.use(authenticate, requireTenant);

usersRouter.get('/', validateQuery(QueryUsersDto), asyncHandler((req, res) => controller.findAll(req, res)));
usersRouter.get('/:id', asyncHandler((req, res) => controller.findById(req, res)));
usersRouter.post('/', requireRole(Role.DIRIGENTE, Role.ADMIN), validateDto(CreateUserDto), asyncHandler((req, res) => controller.create(req, res)));
usersRouter.patch('/:id', requireRole(Role.DIRIGENTE, Role.ADMIN), validateDto(UpdateUserDto), asyncHandler((req, res) => controller.update(req, res)));
usersRouter.delete('/:id', requireRole(Role.ADMIN), asyncHandler((req, res) => controller.remove(req, res)));

export { usersRouter };
