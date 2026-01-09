import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';
import { ClientGuard } from '../guards/client.guard';
import { ClientPermissionGuard } from '../guards/client-permission.guard';

/**
 * Decorator que aplica ClientGuard e adiciona documentação do header X-Client-Id no Swagger
 * Use este decorator em rotas que precisam do clientId
 */
export const RequireClient = () =>
  applyDecorators(
    UseGuards(ClientGuard, ClientPermissionGuard),
    ApiHeader({
      name: 'X-Client-Id',
      description: 'ID do cliente',
      required: true,
      schema: { type: 'string' },
    }),
  );
