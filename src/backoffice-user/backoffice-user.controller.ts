import {
  Body,
  Controller,
  Post,
  Req,
  HttpStatus,
  Delete,
  Param,
  HttpCode,
  Query,
  Get,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BackofficeUserService } from './services/backoffice-user.service';
import { CreateBackofficeUserDto } from './dto/create-backoffice-user.dto';
import { BackofficeUser } from './entities/backoffice-user.entity';
import { resolveClientId } from './helpers/backoffice-client.helper';
import { ApiCreateBackofficeUser } from './docs/api-create-backoffice-user.decorator';
import { ApiDeleteBackofficeUser } from './docs/api-delete-backoffice-user.decorator';
import { ApiFindAllBackofficeUser } from './docs/api-find-all-backoffice-user.decorator';
import type { AuthorizedRequest } from '@/common/interfaces/authorized-request.interface';
import { BackofficeOrInternalAuth } from '@/common/decorators/backoffice-or-internal-auth.decorator';
import { PaginationResult } from '@/common/base-query/interfaces/pagination-result.interface';
import { QueryBackofficeUserDto } from './dto/query-backoffice-user.dto';

@ApiTags('Backoffice Users')
@Controller('backoffice/users')
@BackofficeOrInternalAuth()
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

  @Get()
  @ApiFindAllBackofficeUser()
  async findAll(
    @Query() query: QueryBackofficeUserDto,
    @Req() req: AuthorizedRequest,
  ): Promise<PaginationResult<BackofficeUser>> {
    const clientId = resolveClientId(req);
    return this.userService.findAll(query, clientId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiDeleteBackofficeUser()
  async remove(@Param('id') id: string): Promise<void> {
    return this.userService.remove(id);
  }
}
