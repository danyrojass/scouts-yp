import { Request, Response } from 'express';
import { GroupsService } from './groups.service.js';
import { CreateGroupDto } from './dto/create-group.dto.js';
import { UpdateGroupDto } from './dto/update-group.dto.js';

export class GroupsController {
  private groupsService: GroupsService;

  constructor() {
    this.groupsService = new GroupsService();
  }

  async findAll(req: Request, res: Response): Promise<void> {
    const query = req.query as any;
    const result = await this.groupsService.findAll(req.organizationId!, query);
    res.json({ success: true, data: result });
  }

  async findById(req: Request, res: Response): Promise<void> {
    const group = await this.groupsService.findById(req.organizationId!, req.params.id);
    res.json({ success: true, data: { group } });
  }

  async create(req: Request, res: Response): Promise<void> {
    const dto = req.body as CreateGroupDto;
    const group = await this.groupsService.create(req.organizationId!, dto);
    res.status(201).json({ success: true, data: { group } });
  }

  async update(req: Request, res: Response): Promise<void> {
    const dto = req.body as UpdateGroupDto;
    const group = await this.groupsService.update(req.organizationId!, req.params.id, dto);
    res.json({ success: true, data: { group } });
  }

  async remove(req: Request, res: Response): Promise<void> {
    await this.groupsService.remove(req.organizationId!, req.params.id);
    res.json({ success: true, data: { message: 'Group deleted' } });
  }
}
