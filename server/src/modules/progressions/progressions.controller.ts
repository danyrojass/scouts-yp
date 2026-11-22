import { Request, Response } from 'express';
import { ProgressionsService } from './progressions.service.js';
import { CreateProgressionDto } from './dto/create-progression.dto.js';
import { ApproveProgressionDto } from './dto/approve-progression.dto.js';
import { Actor } from '../../common/types/actor.js';

export class ProgressionsController {
  private progressionsService: ProgressionsService;

  constructor() {
    this.progressionsService = new ProgressionsService();
  }

  async findAll(req: Request, res: Response): Promise<void> {
    const actor: Actor = { id: req.user!.sub, role: req.user!.role };
    const query = req.query as any;
    const result = await this.progressionsService.findAll(req.groupId!, actor, query);
    res.json({ success: true, data: result });
  }

  async findById(req: Request, res: Response): Promise<void> {
    const actor: Actor = { id: req.user!.sub, role: req.user!.role };
    const progression = await this.progressionsService.findById(req.groupId!, actor, req.params.id);
    res.json({ success: true, data: { progression } });
  }

  async create(req: Request, res: Response): Promise<void> {
    const dto = req.body as CreateProgressionDto;
    const progression = await this.progressionsService.create(req.groupId!, dto);
    res.status(201).json({ success: true, data: { progression } });
  }

  async approve(req: Request, res: Response): Promise<void> {
    const actor: Actor = { id: req.user!.sub, role: req.user!.role };
    const dto = req.body as ApproveProgressionDto;
    const progression = await this.progressionsService.approve(req.groupId!, actor, req.params.id, dto);
    res.json({ success: true, data: { progression } });
  }

  async remove(req: Request, res: Response): Promise<void> {
    await this.progressionsService.remove(req.groupId!, req.params.id);
    res.json({ success: true, data: { message: 'Progression deleted' } });
  }
}
