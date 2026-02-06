import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ProviderSession } from '../contracts/provider-session';

export const CurrentSession = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): ProviderSession => {
    const request = ctx.switchToHttp().getRequest();
    return request.providerSession;
  },
);
