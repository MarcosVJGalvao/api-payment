import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ProviderSession } from '../hiperbanco/interfaces/provider-session.interface';

export const CurrentSession = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): ProviderSession => {
        const request = ctx.switchToHttp().getRequest();
        return request.providerSession;
    },
);
