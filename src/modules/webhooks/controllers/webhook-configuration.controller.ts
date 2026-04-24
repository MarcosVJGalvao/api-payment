import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { BackofficeAuthGuard } from '@/backoffice-user/guards/backoffice-auth.guard';
import { WebhookConfigurationService } from '../services/webhook-configuration.service';
import type { CreateWebhookConfigurationDto } from '../dto/create-webhook-configuration.dto';
import type { UpdateWebhookConfigurationDto } from '../dto/update-webhook-configuration.dto';
import { ApiCreateWebhookConfiguration } from '../docs/api-create-webhook-configuration.decorator';
import { ApiListWebhookConfigurations } from '../docs/api-list-webhook-configurations.decorator';
import { ApiGetWebhookConfiguration } from '../docs/api-get-webhook-configuration.decorator';
import { ApiUpdateWebhookConfiguration } from '../docs/api-update-webhook-configuration.decorator';
import { ApiDeleteWebhookConfiguration } from '../docs/api-delete-webhook-configuration.decorator';
import { ApiToggleWebhookConfiguration } from '../docs/api-toggle-webhook-configuration.decorator';

@ApiTags('Webhook Configurations')
@ApiBearerAuth('backoffice-auth')
@ApiHeader({
  name: 'X-Client-Id',
  description: 'ID do cliente',
  required: true,
  schema: { type: 'string' },
})
@UseGuards(BackofficeAuthGuard)
@Controller('webhooks/configurations')
export class WebhookConfigurationController {
  constructor(private readonly service: WebhookConfigurationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateWebhookConfiguration()
  async create(@Req() req: any, @Body() dto: CreateWebhookConfigurationDto) {
    return this.service.create(String(req.user.clientId), dto);
  }

  @Get()
  @ApiListWebhookConfigurations()
  async findAll(@Req() req: any) {
    return this.service.findAll(String(req.user.clientId));
  }

  @Get(':id')
  @ApiGetWebhookConfiguration()
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.service.findOne(id, String(req.user.clientId));
  }

  @Patch(':id')
  @ApiUpdateWebhookConfiguration()
  async update(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: UpdateWebhookConfigurationDto,
  ) {
    return this.service.update(id, String(req.user.clientId), dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiDeleteWebhookConfiguration()
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.service.remove(id, String(req.user.clientId));
  }

  @Patch(':id/toggle')
  @ApiToggleWebhookConfiguration()
  async toggle(@Param('id') id: string, @Req() req: any) {
    return this.service.toggle(id, String(req.user.clientId));
  }
}
