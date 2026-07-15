import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { validateDto } from '../../common/middleware/validate.middleware.js';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

const authRouter = Router();
const controller = new AuthController();

authRouter.post('/register', validateDto(RegisterDto), (req, res) => controller.register(req, res));
authRouter.post('/login', validateDto(LoginDto), (req, res) => controller.login(req, res));
authRouter.post('/refresh', (req, res) => controller.refresh(req, res));
authRouter.post('/logout', (req, res) => controller.logout(req, res));
authRouter.get('/me', authenticate, (req, res) => controller.me(req, res));

export { authRouter };
