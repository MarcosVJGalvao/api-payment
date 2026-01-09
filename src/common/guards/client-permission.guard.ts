import {
  Injectable,
  ExecutionContext,
  CanActivate,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionService } from '@/permissions/services/permission.service';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import { RequestWithClient } from './client.guard';
import { REQUIRED_CLIENT_PERMISSION_KEY } from '../decorators/require-client-permission.decorator';

@Injectable()
export class ClientPermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionService: PermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<string>(
      REQUIRED_CLIENT_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermission) {
      return true; // Se não há permissão requerida, permite acesso
    }

    const request = context.switchToHttp().getRequest<RequestWithClient>();
    const clientId = request.clientId;

    if (!clientId) {
      throw new CustomHttpException(
        'Client ID is required for permission validation',
        HttpStatus.BAD_REQUEST,
        ErrorCode.CLIENT_NOT_FOUND,
      );
    }

    const hasPermission = await this.permissionService.clientHasPermission(
      clientId,
      requiredPermission,
    );

    if (!hasPermission) {
      throw new CustomHttpException(
        `Client does not have permission: ${requiredPermission}`,
        HttpStatus.FORBIDDEN,
        ErrorCode.ACCESS_DENIED,
      );
    }

    return true;
  }
}
