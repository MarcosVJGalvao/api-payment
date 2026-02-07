import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(
    req: Request & { correlationId?: string },
    res: Response,
    next: NextFunction,
  ) {
    const headerValue = req.headers['x-correlation-id'];
    const incomingCorrelationId = Array.isArray(headerValue)
      ? headerValue[0]
      : headerValue;

    const correlationId =
      typeof incomingCorrelationId === 'string' &&
      incomingCorrelationId.trim() !== ''
        ? incomingCorrelationId.trim()
        : uuidv4();

    req.correlationId = correlationId;
    res.setHeader('X-Correlation-ID', correlationId);
    next();
  }
}
