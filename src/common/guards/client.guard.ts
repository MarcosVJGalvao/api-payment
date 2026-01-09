import {
  Injectable,
  ExecutionContext,
  HttpStatus,
  CanActivate,
} from '@nestjs/common';
import { ClientService } from '@/client/client.service';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import { ClientStatus } from '@/client/enums/client-status.enum';

export interface RequestWithClient {
  clientId?: string;
  client?: {
    id: string;
    name: string;
    status: ClientStatus;
  };
  headers: {
    'x-client-id'?: string;
    'X-Client-Id'?: string;
    [key: string]: string | string[] | undefined;
  };
  [key: string]: unknown;
}

@Injectable()
export class ClientGuard implements CanActivate {
  constructor(private readonly clientService: ClientService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithClient>();
    const clientId =
      request.headers['x-client-id'] || request.headers['X-Client-Id'];

    if (!clientId || typeof clientId !== 'string') {
      throw new CustomHttpException(
        'X-Client-Id header is required',
        HttpStatus.BAD_REQUEST,
        ErrorCode.CLIENT_NOT_FOUND,
      );
    }

    const client = await this.clientService.findById(clientId);

    if (client.status !== ClientStatus.ACTIVE) {
      throw new CustomHttpException(
        'Client is not active',
        HttpStatus.FORBIDDEN,
        ErrorCode.CLIENT_NOT_ACTIVE,
      );
    }

    request.clientId = client.id;
    request.client = {
      id: client.id,
      name: client.name,
      status: client.status,
    };

    return true;
  }
}
