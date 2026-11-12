import { Router } from 'express';
import { CompletionsController } from './completions.controller.js';
import { validateDto } from '../../common/middleware/validate.middleware.js';
import { validateQuery } from '../../common/middleware/validate-query.middleware.js';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { requireGroup } from '../../common/middleware/group.middleware.js';
import { asyncHandler } from '../../common/middleware/async-handler.js';
import { QueryCompletionsDto } from './dto/query-completions.dto.js';
import { CreateCompletionDto } from './dto/create-completion.dto.js';

const completionsRouter = Router();
const controller = new CompletionsController();

completionsRouter.use(authenticate, requireGroup);

completionsRouter.get('/', validateQuery(QueryCompletionsDto), asyncHandler((req, res) => controller.findAll(req, res)));
completionsRouter.post('/', validateDto(CreateCompletionDto), asyncHandler((req, res) => controller.create(req, res)));

export { completionsRouter };
