import { Request, Response } from 'express';
import { ActivitiesService } from './activities.service.js';
import { CreateActivityDto } from './dto/create-activity.dto.js';
import { UpdateActivityDto } from './dto/update-activity.dto.js';

export class ActivitiesController {
  private activitiesService: ActivitiesService;

  constructor() {
    this.activitiesService = new ActivitiesService();
  }

  async findAll(req: Request, res: Response): Promise<void> {
    const query = req.query as any;
    const result = await this.activitiesService.findAll(req.groupId!, query);
    res.json({ success: true, data: result });
  }

  async findById(req: Request, res: Response): Promise<void> {
    const activity = await this.activitiesService.findById(req.groupId!, req.params.id);
    res.json({ success: true, data: { activity } });
  }

  async create(req: Request, res: Response): Promise<void> {
    const dto = req.body as CreateActivityDto;
    const activity = await this.activitiesService.create(req.groupId!, dto);
    res.status(201).json({ success: true, data: { activity } });
  }

  async update(req: Request, res: Response): Promise<void> {
    const dto = req.body as UpdateActivityDto;
    const activity = await this.activitiesService.update(req.groupId!, req.params.id, dto);
    res.json({ success: true, data: { activity } });
  }

  async remove(req: Request, res: Response): Promise<void> {
    await this.activitiesService.remove(req.groupId!, req.params.id);
    res.json({ success: true, data: { message: 'Activity deleted' } });
  }
}
