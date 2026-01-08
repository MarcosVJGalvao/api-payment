import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CreateClientDto } from '../dto/create-client.dto';
import { Client } from '../entities/client.entity';

export function ApiCreateClient() {
  return applyDecorators(
    ApiOperation({ summary: 'Criar um novo cliente' }),
    ApiBody({ type: CreateClientDto }),
    ApiResponse({
      status: 201,
      description: 'Cliente criado com sucesso',
      type: Client,
    }),
    ApiResponse({
      status: 400,
      description: 'Erro de validação',
    }),
    ApiResponse({
      status: 409,
      description: 'Cliente com este documento já existe',
    }),
  );
}
