import { Request, Response } from 'express';
import { PaymentsService } from './payments.service.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { Actor } from '../../common/types/actor.js';

export class PaymentsController {
  private paymentsService: PaymentsService;

  constructor() {
    this.paymentsService = new PaymentsService();
  }

  async findAll(req: Request, res: Response): Promise<void> {
    const actor: Actor = { id: req.user!.sub, role: req.user!.role };
    const query = req.query as any;
    const result = await this.paymentsService.findAll(req.groupId!, actor, query);
    res.json({ success: true, data: result });
  }

  async findById(req: Request, res: Response): Promise<void> {
    const actor: Actor = { id: req.user!.sub, role: req.user!.role };
    const payment = await this.paymentsService.findById(req.groupId!, actor, req.params.id);
    res.json({ success: true, data: { payment } });
  }

  async create(req: Request, res: Response): Promise<void> {
    const dto = req.body as CreatePaymentDto;
    const payment = await this.paymentsService.create(req.groupId!, dto);
    res.status(201).json({ success: true, data: { payment } });
  }

  async remove(req: Request, res: Response): Promise<void> {
    await this.paymentsService.remove(req.groupId!, req.params.id);
    res.json({ success: true, data: { message: 'Payment deleted' } });
  }
}
