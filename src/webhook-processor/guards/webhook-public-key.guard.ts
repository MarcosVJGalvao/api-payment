import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import type { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Webhook } from '@/webhook/entities/webhook.entity';

/**
 * Guard para validar publicKey do header de webhooks.
 * Se a publicKey não for válida, retorna true mas NÃO processa.
 * Adiciona flag no request para indicar validade.
 */
@Injectable()
export class WebhookPublicKeyGuard implements CanActivate {
  private readonly logger = new Logger(WebhookPublicKeyGuard.name);

  constructor(
    @InjectRepository(Webhook)
    private readonly webhookRepository: Repository<Webhook>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const publicKey = request.headers['publickey'] as string;
    const provider = request.params.provider;

    if (!publicKey) {
      this.logger.warn(
        `Webhook received without publicKey from provider: ${provider}. Webhook will be IGNORED.`,
      );
      request['validPublicKey'] = false;
      return true;
    }

    const webhook = await this.webhookRepository.findOne({
      where: { publicKey, isActive: true },
    });

    if (!webhook) {
      this.logger.warn(
        `Invalid publicKey received: ${publicKey.substring(0, 8)}... from provider: ${provider}. Webhook will be IGNORED.`,
      );
      request['validPublicKey'] = false;
      return true;
    }

    request['validPublicKey'] = true;
    request['webhookClientId'] = webhook.clientId;

    return true;
  }
}
