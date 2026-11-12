import { Request, Response } from 'express';
import { SetsService } from './sets.service.js';
import { CreateSetDto } from './dto/create-set.dto.js';
import { UpdateSetDto } from './dto/update-set.dto.js';

export class SetsController {
  private setsService: SetsService;

  constructor() {
    this.setsService = new SetsService();
  }

  async findAll(req: Request, res: Response): Promise<void> {
    const query = req.query as any;
    const result = await this.setsService.findAll(req.organizationId!, query);
    res.json({ success: true, data: result });
  }

  async findById(req: Request, res: Response): Promise<void> {
    const set = await this.setsService.findById(req.organizationId!, req.params.id);
    res.json({ success: true, data: { set } });
  }

  async create(req: Request, res: Response): Promise<void> {
    const dto = req.body as CreateSetDto;
    const set = await this.setsService.create(req.organizationId!, dto);
    res.status(201).json({ success: true, data: { set } });
  }

  async update(req: Request, res: Response): Promise<void> {
    const dto = req.body as UpdateSetDto;
    const set = await this.setsService.update(req.organizationId!, req.params.id, dto);
    res.json({ success: true, data: { set } });
  }

  async remove(req: Request, res: Response): Promise<void> {
    await this.setsService.remove(req.organizationId!, req.params.id);
    res.json({ success: true, data: { message: 'Set deleted' } });
  }
}
