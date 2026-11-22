import { Router } from 'express';
import { Role } from '@prisma/client';
import { PaymentsController } from './payments.controller.js';
import { validateDto } from '../../common/middleware/validate.middleware.js';
import { validateQuery } from '../../common/middleware/validate-query.middleware.js';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { requireGroup } from '../../common/middleware/group.middleware.js';
import { requireAtLeast } from '../../common/middleware/roles.guard.js';
import { asyncHandler } from '../../common/middleware/async-handler.js';
import { QueryPaymentsDto } from './dto/query-payments.dto.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';

const paymentsRouter = Router();
const controller = new PaymentsController();

paymentsRouter.use(authenticate, requireGroup);

paymentsRouter.get('/', validateQuery(QueryPaymentsDto), asyncHandler((req, res) => controller.findAll(req, res)));
paymentsRouter.get('/:id', asyncHandler((req, res) => controller.findById(req, res)));
paymentsRouter.post('/', requireAtLeast(Role.DIRIGENTE), validateDto(CreatePaymentDto), asyncHandler((req, res) => controller.create(req, res)));
paymentsRouter.delete('/:id', requireAtLeast(Role.ADMIN), asyncHandler((req, res) => controller.remove(req, res)));

export { paymentsRouter };
