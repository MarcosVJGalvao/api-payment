import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  HttpStatus,
  Delete,
  Param,
  HttpCode,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BackofficeUserService } from './services/backoffice-user.service';
import { CreateBackofficeUserDto } from './dto/create-backoffice-user.dto';
import { BackofficeUser } from './entities/backoffice-user.entity';
import { resolveClientId } from './helpers/backoffice-client.helper';
import { BackofficeOrInternalGuard } from './guards/backoffice-or-internal.guard';
import { ApiCreateBackofficeUser } from './docs/api-create-backoffice-user.decorator';
import { ApiDeleteBackofficeUser } from './docs/api-delete-backoffice-user.decorator';
import type { AuthorizedRequest } from '@/common/interfaces/authorized-request.interface';

@ApiTags('Backoffice Users')
@Controller('backoffice/users')
@UseGuards(BackofficeOrInternalGuard)
export class BackofficeUserController {
  constructor(private readonly userService: BackofficeUserService) {}

  @Post()
  @ApiCreateBackofficeUser()
  async create(
    @Body() dto: CreateBackofficeUserDto,
    @Req() req: AuthorizedRequest,
  ): Promise<BackofficeUser> {
    const clientId = resolveClientId(req);
    return this.userService.create(dto, clientId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiDeleteBackofficeUser()
  async remove(@Param('id') id: string): Promise<void> {
    return this.userService.remove(id);
  }
}
