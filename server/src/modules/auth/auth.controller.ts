import { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { env } from '../../config/env.js';

const ACCESS_MAX_AGE = 15 * 60 * 1000;
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  async register(req: Request, res: Response): Promise<void> {
    const result = await this.authService.register(req.body);

    this.setCookies(res, result.accessToken, result.refreshToken);

    res.status(201).json({ success: true, data: { user: result.user } });
  }

  async login(req: Request, res: Response): Promise<void> {
    const result = await this.authService.login(req.body);

    this.setCookies(res, result.accessToken, result.refreshToken);

    res.json({ success: true, data: { user: result.user } });
  }

  async refresh(req: Request, res: Response): Promise<void> {
    const token = req.cookies?.refresh_token;
    if (!token) {
      res.status(401).json({ success: false, error: { message: 'Refresh token required' } });
      return;
    }

    const result = await this.authService.refresh(token);

    this.setCookies(res, result.accessToken, result.refreshToken);

    res.json({ success: true, data: { message: 'Token refreshed' } });
  }

  async logout(req: Request, res: Response): Promise<void> {
    const token = req.cookies?.refresh_token;
    if (token) {
      await this.authService.logout(token);
    }

    this.clearCookies(res);

    res.json({ success: true, data: { message: 'Logged out' } });
  }

  async me(req: Request, res: Response): Promise<void> {
    const user = await this.authService.me(req.user!.sub);
    res.json({ success: true, data: { user } });
  }

  private setCookies(res: Response, accessToken: string, refreshToken: string): void {
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: ACCESS_MAX_AGE,
      path: '/',
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: REFRESH_MAX_AGE,
      path: '/api/v1/auth',
    });
  }

  private clearCookies(res: Response): void {
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/api/v1/auth' });
  }
}
