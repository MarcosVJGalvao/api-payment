import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedInternalUserRequest } from '../guards/internal-auth.guard';

export const CurrentInternalUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedInternalUserRequest>();
    return request.user;
  },
);
