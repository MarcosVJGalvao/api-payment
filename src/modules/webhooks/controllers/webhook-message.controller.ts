import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { BackofficeAuthGuard } from '@/backoffice-user/guards/backoffice-auth.guard';
import { WebhookMessageService } from '../services/webhook-message.service';
import type { QueryWebhookMessageDto } from '../dto/query-webhook-message.dto';
import type { ReprocessWebhookMessagesDto } from '../dto/reprocess-webhook-messages.dto';
import { ApiListWebhookMessages } from '../docs/api-list-webhook-messages.decorator';
import { ApiGetWebhookMessage } from '../docs/api-get-webhook-message.decorator';
import { ApiReprocessWebhookMessages } from '../docs/api-reprocess-webhook-messages.decorator';

@ApiTags('Webhook Messages')
@ApiBearerAuth('backoffice-auth')
@ApiHeader({
  name: 'X-Client-Id',
  description: 'ID do cliente',
  required: true,
  schema: { type: 'string' },
})
@UseGuards(BackofficeAuthGuard)
@Controller('webhooks/messages')
export class WebhookMessageController {
  constructor(private readonly service: WebhookMessageService) {}

  @Get()
  @ApiListWebhookMessages()
  async findAll(@Req() req: any, @Query() query: QueryWebhookMessageDto) {
    return this.service.findAll(String(req.user.clientId), query);
  }

  @Get(':id')
  @ApiGetWebhookMessage()
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.service.findOne(id, String(req.user.clientId));
  }

  @Post('reprocess')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiReprocessWebhookMessages()
  async reprocess(@Req() req: any, @Body() dto: ReprocessWebhookMessagesDto) {
    return this.service.reprocess(String(req.user.clientId), dto);
  }
}
