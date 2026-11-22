import { Request, Response } from 'express';
import { CompletionsService } from './completions.service.js';
import { CreateCompletionDto } from './dto/create-completion.dto.js';
import { Actor } from '../../common/types/actor.js';

export class CompletionsController {
  private completionsService: CompletionsService;

  constructor() {
    this.completionsService = new CompletionsService();
  }

  async findAll(req: Request, res: Response): Promise<void> {
    const query = req.query as any;
    const result = await this.completionsService.findAll(req.groupId!, query);
    res.json({ success: true, data: result });
  }

  async create(req: Request, res: Response): Promise<void> {
    const actor: Actor = { id: req.user!.sub, role: req.user!.role };
    const dto = req.body as CreateCompletionDto;
    const completion = await this.completionsService.create(req.groupId!, actor, dto);
    res.status(201).json({ success: true, data: { completion } });
  }
}
