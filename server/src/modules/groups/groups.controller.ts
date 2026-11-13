import { Request, Response } from 'express';
import { GroupsService } from './groups.service.js';
import { CreateGroupDto } from './dto/create-group.dto.js';
import { UpdateGroupDto } from './dto/update-group.dto.js';

export class GroupsController {
  private groupsService: GroupsService;

  constructor() {
    this.groupsService = new GroupsService();
  }

  async findMe(req: Request, res: Response): Promise<void> {
    const group = await this.groupsService.findMe(req.groupId!);
    res.json({ success: true, data: { group } });
  }

  async updateMe(req: Request, res: Response): Promise<void> {
    const dto = req.body as UpdateGroupDto;
    const group = await this.groupsService.updateMe(req.groupId!, dto);
    res.json({ success: true, data: { group } });
  }

  async findAll(req: Request, res: Response): Promise<void> {
    const query = req.query as any;
    const result = await this.groupsService.findAll(query);
    res.json({ success: true, data: result });
  }

  async findById(req: Request, res: Response): Promise<void> {
    const group = await this.groupsService.findById(req.params.id);
    res.json({ success: true, data: { group } });
  }

  async create(req: Request, res: Response): Promise<void> {
    const dto = req.body as CreateGroupDto;
    const result = await this.groupsService.create(dto);
    res.status(201).json({ success: true, data: result });
  }

  async update(req: Request, res: Response): Promise<void> {
    const dto = req.body as UpdateGroupDto;
    const group = await this.groupsService.update(req.params.id, dto);
    res.json({ success: true, data: { group } });
  }

  async remove(req: Request, res: Response): Promise<void> {
    await this.groupsService.remove(req.params.id);
    res.json({ success: true, data: { message: 'Group deactivated' } });
  }
}
