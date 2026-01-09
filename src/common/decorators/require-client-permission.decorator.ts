import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';
import { ClientGuard } from '../guards/client.guard';
import { ClientPermissionGuard } from '../guards/client-permission.guard';

export const REQUIRED_CLIENT_PERMISSION_KEY = 'requiredClientPermission';

/**
 * Decorator para especificar a permissão requerida para a rota ou controller.
 * Aplica ClientGuard e ClientPermissionGuard automaticamente.
 * Use este decorator quando precisar apenas validar permissão (sem accountId).
 * @param permissionName Nome da permissão (ex: 'financial:boleto', 'integration:webhook', 'auth:bank')
 */
export const RequireClientPermission = (permissionName: string) =>
  applyDecorators(
    UseGuards(ClientGuard, ClientPermissionGuard),
    ApiHeader({
      name: 'X-Client-Id',
      description: 'ID do cliente',
      required: true,
    }),
    SetMetadata(REQUIRED_CLIENT_PERMISSION_KEY, permissionName),
  );
