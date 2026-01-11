import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BackofficeUserService } from './services/backoffice-user.service';
import { CreateBackofficeUserDto } from './dto/create-backoffice-user.dto';
import { BackofficeUser } from './entities/backoffice-user.entity';
// import { InternalAdminGuard } from '@/common/guards/internal-admin.guard'; // Assume this exists or similar
// import { ClientAdminGuard } from '@/common/guards/client-admin.guard'; // Assume this exists or similar

import { BackofficeOrInternalGuard } from './guards/backoffice-or-internal.guard';

@ApiTags('Backoffice Users')
@Controller('backoffice/users')
export class BackofficeUserController {
  constructor(private readonly userService: BackofficeUserService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new Backoffice User' })
  @UseGuards(BackofficeOrInternalGuard)
  async create(
    @Body() dto: CreateBackofficeUserDto,
    @Req() req: any,
  ): Promise<BackofficeUser> {
    const clientId = this.resolveClientId(req);
    return this.userService.create(dto, clientId);
  }

  private resolveClientId(req: any): string {
    // 1. If Backoffice User (JWT in req.user)
    if (req.user && req.user.clientId) {
      return req.user.clientId;
    }

    // 2. If Internal User (Admin) - Expect clientId in body
    // We assume Internal Auth Guard populates req.user without clientId but with hasPermission maybe?
    // Or we simply check if clientId is in body and fallback to it if user is internal.
    // Ideally we strictly validate:
    // If not Backoffice User, MUST be Internal User (checked by Guard).

    if (req.body.clientId) {
      return req.body.clientId;
    }

    throw new CustomHttpException(
      'Client ID is missing',
      HttpStatus.BAD_REQUEST,
      ErrorCode.INVALID_INPUT,
    );
  }
}
