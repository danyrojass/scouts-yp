import { Request, Response } from 'express';
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

export class UsersController {
  private usersService: UsersService;

  constructor() {
    this.usersService = new UsersService();
  }

  async findAll(req: Request, res: Response): Promise<void> {
    const query = req.query as any;
    const result = await this.usersService.findAll(req.organizationId!, query);
    res.json({ success: true, data: result });
  }

  async findById(req: Request, res: Response): Promise<void> {
    const user = await this.usersService.findById(req.organizationId!, req.params.id);
    res.json({ success: true, data: { user } });
  }

  async create(req: Request, res: Response): Promise<void> {
    const dto = req.body as CreateUserDto;
    const user = await this.usersService.create(req.organizationId!, dto);
    res.status(201).json({ success: true, data: { user } });
  }

  async update(req: Request, res: Response): Promise<void> {
    const dto = req.body as UpdateUserDto;
    const user = await this.usersService.update(req.organizationId!, req.params.id, dto);
    res.json({ success: true, data: { user } });
  }

  async remove(req: Request, res: Response): Promise<void> {
    await this.usersService.remove(req.organizationId!, req.params.id);
    res.json({ success: true, data: { message: 'User deactivated' } });
  }
}
