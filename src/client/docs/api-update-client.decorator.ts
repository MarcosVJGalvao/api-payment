import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { UpdateClientDto } from '../dto/update-client.dto';
import { Client } from '../entities/client.entity';

export function ApiUpdateClient() {
  return applyDecorators(
    ApiOperation({ summary: 'Atualizar cliente' }),
    ApiParam({ name: 'id', description: 'ID do cliente' }),
    ApiBody({
      type: UpdateClientDto,
      examples: {
        'Atualizar Nome': {
          summary: 'Atualizar nome do cliente',
          value: {
            name: 'Empresa ABC Ltda',
          },
        },
        'Atualizar Scopes': {
          summary: 'Atualizar permissões do cliente',
          value: {
            scopes: [
              'financial:boleto',
              'financial:pix',
              'integration:webhook',
            ],
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Cliente atualizado com sucesso',
      type: Client,
    }),
    ApiResponse({
      status: 404,
      description: 'Cliente não encontrado',
    }),
  );
}
