import { HttpStatus, Injectable } from '@nestjs/common';
import { WebhookConfigurationRepository } from '../repositories/webhook-configuration.repository';
import { WebhookHmacSigningService } from './webhook-hmac-signing.service';
import { WebhookConfiguration } from '../entities/webhook-configuration.entity';
import type { CreateWebhookConfigurationDto } from '../dto/create-webhook-configuration.dto';
import type { UpdateWebhookConfigurationDto } from '../dto/update-webhook-configuration.dto';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';

export interface WebhookConfigurationWithPrivateKey extends WebhookConfiguration {
  privateKey: string;
}

@Injectable()
export class WebhookConfigurationService {
  constructor(
    private readonly configurationRepository: WebhookConfigurationRepository,
    private readonly hmacSigningService: WebhookHmacSigningService,
  ) {}

  async create(
    clientId: string,
    dto: CreateWebhookConfigurationDto,
  ): Promise<WebhookConfigurationWithPrivateKey> {
    const { publicKey, privateKey } = this.resolveKeys(dto.publicKey, dto.privateKey);

    const entity = await this.configurationRepository.save({
      clientId,
      eventType: dto.eventType,
      url: dto.url,
      publicKey,
      privateKey,
      isActive: true,
      circuitBreakerFailureCount: 0,
      circuitBreakerOpenUntil: null,
    });

    return { ...entity, privateKey };
  }

  async findAll(clientId: string): Promise<WebhookConfiguration[]> {
    return this.configurationRepository.findByClientId(clientId);
  }

  async findOne(id: string, clientId: string): Promise<WebhookConfiguration> {
    const config = await this.configurationRepository.findById(id);
    this.assertExists(config);
    this.assertOwnership(config!, clientId);
    return config!;
  }

  async update(
    id: string,
    clientId: string,
    dto: UpdateWebhookConfigurationDto,
  ): Promise<WebhookConfigurationWithPrivateKey | WebhookConfiguration> {
    const config = await this.configurationRepository.findById(id);
    this.assertExists(config);
    this.assertOwnership(config!, clientId);

    const updateData: Partial<WebhookConfiguration> = {};
    if (dto.url) updateData.url = dto.url;
    if (dto.eventType) updateData.eventType = dto.eventType;

    let returnedPrivateKey: string | undefined;

    if (dto.publicKey || dto.privateKey) {
      const { publicKey, privateKey } = this.resolveKeys(dto.publicKey, dto.privateKey);
      updateData.publicKey = publicKey;
      updateData.privateKey = privateKey;
      returnedPrivateKey = privateKey;
    }

    const updated = await this.configurationRepository.update(id, updateData);
    if (returnedPrivateKey) {
      return { ...updated!, privateKey: returnedPrivateKey };
    }
    return updated!;
  }

  async remove(id: string, clientId: string): Promise<void> {
    const config = await this.configurationRepository.findById(id);
    this.assertExists(config);
    this.assertOwnership(config!, clientId);
    await this.configurationRepository.softDelete(id);
  }

  async toggle(id: string, clientId: string): Promise<WebhookConfiguration> {
    const config = await this.configurationRepository.findById(id);
    this.assertExists(config);
    this.assertOwnership(config!, clientId);
    const updated = await this.configurationRepository.update(id, {
      isActive: !config!.isActive,
    });
    return updated!;
  }

  private resolveKeys(
    providedPublicKey?: string,
    providedPrivateKey?: string,
  ): { publicKey: string; privateKey: string } {
    if (providedPublicKey && providedPrivateKey) {
      return { publicKey: providedPublicKey, privateKey: providedPrivateKey };
    }
    const generated = this.hmacSigningService.generateKeyPair();
    return {
      publicKey: providedPublicKey ?? generated.publicKey,
      privateKey: providedPrivateKey ?? generated.privateKey,
    };
  }

  private assertExists(
    config: WebhookConfiguration | null,
  ): asserts config is WebhookConfiguration {
    if (!config) {
      throw new CustomHttpException(
        'Webhook configuration not found',
        HttpStatus.NOT_FOUND,
        ErrorCode.WEBHOOK_CONFIGURATION_NOT_FOUND,
      );
    }
  }

  private assertOwnership(config: WebhookConfiguration, clientId: string): void {
    if (config.clientId !== clientId) {
      throw new CustomHttpException(
        'Webhook configuration not found',
        HttpStatus.NOT_FOUND,
        ErrorCode.WEBHOOK_CONFIGURATION_NOT_FOUND,
      );
    }
  }
}
