import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';
import { ClientGuard } from '../guards/client.guard';
import { AccountGuard } from '@/financial-providers/guards/account.guard';
import { ClientPermissionGuard } from '../guards/client-permission.guard';

/**
 * Decorator que aplica ClientGuard e AccountGuard e adiciona documentação dos headers no Swagger
 * Use este decorator em rotas que precisam do clientId e accountId
 */
export const RequireClientAccount = () =>
  applyDecorators(
    UseGuards(ClientGuard, AccountGuard, ClientPermissionGuard),
    ApiHeader({
      name: 'X-Client-Id',
      description: 'ID do cliente',
      required: true,
    }),
    ApiHeader({
      name: 'X-Account-Id',
      description: 'ID da conta (pode vir do JWT após login bank)',
      required: false,
    }),
  );
