import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { PermissionService } from '../services/permission.service';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { HttpStatus } from '@nestjs/common';
import { AuthenticatedRequest } from '../interfaces/authenticate.interface';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionService: PermissionService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user || !user.userId) {
      throw new CustomHttpException(
        'User not authenticated.',
        HttpStatus.UNAUTHORIZED,
        ErrorCode.USER_NOT_AUTHENTICATED,
      );
    }

    const hasPermission = await this.permissionService.hasAnyPermission(
      user.userId,
      requiredPermissions,
    );

    if (!hasPermission) {
      throw new CustomHttpException(
        'Permission denied.',
        HttpStatus.FORBIDDEN,
        ErrorCode.ACCESS_DENIED,
      );
    }

    return true;
  }
}
