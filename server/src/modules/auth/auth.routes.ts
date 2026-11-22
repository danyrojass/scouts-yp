import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { validateDto } from '../../common/middleware/validate.middleware.js';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { asyncHandler } from '../../common/middleware/async-handler.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';

const authRouter = Router();
const controller = new AuthController();

authRouter.post('/register', validateDto(RegisterDto), asyncHandler((req, res) => controller.register(req, res)));
authRouter.post('/login', validateDto(LoginDto), asyncHandler((req, res) => controller.login(req, res)));
authRouter.post('/refresh', asyncHandler((req, res) => controller.refresh(req, res)));
authRouter.post('/logout', asyncHandler((req, res) => controller.logout(req, res)));
authRouter.get('/me', authenticate, asyncHandler((req, res) => controller.me(req, res)));
authRouter.patch('/password', authenticate, validateDto(ChangePasswordDto), asyncHandler((req, res) => controller.changePassword(req, res)));

export { authRouter };
