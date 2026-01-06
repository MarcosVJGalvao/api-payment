import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const correlationId = uuidv4();
    (req as Request & { correlationId?: string }).correlationId = correlationId;
    res.setHeader('X-Correlation-ID', correlationId);
    next();
  }
}
