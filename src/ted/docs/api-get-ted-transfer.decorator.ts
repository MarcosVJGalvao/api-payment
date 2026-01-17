import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { TedTransferStatus } from '../enums/ted-transfer-status.enum';

export function ApiGetTedTransfer() {
  return applyDecorators(
    ApiOperation({
      summary: 'Buscar detalhes de uma transferência TED',
      description:
        'Retorna os detalhes completos de uma transferência TED específica, ' +
        'incluindo informações do remetente, destinatário e status atualizado.',
    }),
    ApiParam({
      name: 'provider',
      description: 'Provedor financeiro',
      example: FinancialProvider.HIPERBANCO,
      enum: FinancialProvider,
    }),
    ApiParam({
      name: 'id',
      description: 'ID único da transferência TED (UUID)',
      example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      type: String,
    }),
    ApiResponse({
      status: 200,
      description: 'Detalhes da transferência TED retornados com sucesso',
      schema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            description: 'ID único da transferência',
          },
          authenticationCode: {
            type: 'string',
            example: 'ABC123DEF456GHI789',
            description: 'Código de autenticação do provedor',
          },
          correlationId: {
            type: 'string',
            example: 'corr-12345-abcde',
            description: 'ID de correlação para rastreamento',
            nullable: true,
          },
          idempotencyKey: {
            type: 'string',
            example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            description: 'Chave de idempotência da requisição',
            nullable: true,
          },
          status: {
            type: 'string',
            example: TedTransferStatus.DONE,
            enum: Object.values(TedTransferStatus),
            description: 'Status atual da transferência',
          },
          amount: {
            type: 'number',
            example: 1500.0,
            description: 'Valor da transferência',
          },
          currency: {
            type: 'string',
            example: 'BRL',
            description: 'Moeda da transferência',
          },
          description: {
            type: 'string',
            example: 'Pagamento de fornecedor',
            description: 'Descrição da transferência',
            nullable: true,
          },
          channel: {
            type: 'string',
            example: 'API',
            description: 'Canal de origem da transferência',
            nullable: true,
          },
          scheduledDate: {
            type: 'string',
            format: 'date',
            example: '2026-01-20',
            description: 'Data agendada para a transferência',
            nullable: true,
          },
          paymentDate: {
            type: 'string',
            format: 'date-time',
            example: '2026-01-17T10:05:00.000Z',
            description: 'Data/hora em que a transferência foi efetivada',
            nullable: true,
          },
          refusalReason: {
            type: 'string',
            example: 'Conta destinatária inválida',
            description: 'Motivo da recusa (quando aplicável)',
            nullable: true,
          },
          sender: {
            type: 'object',
            description: 'Dados do remetente',
            properties: {
              name: {
                type: 'string',
                example: 'João da Silva',
              },
              documentNumber: {
                type: 'string',
                example: '12345678901',
              },
              accountBranch: {
                type: 'string',
                example: '0001',
              },
              accountNumber: {
                type: 'string',
                example: '123456',
              },
              bankIspb: {
                type: 'string',
                example: '13140088',
              },
              bankName: {
                type: 'string',
                example: 'Hiperbanco',
              },
            },
          },
          recipient: {
            type: 'object',
            description: 'Dados do destinatário',
            properties: {
              name: {
                type: 'string',
                example: 'Maria Oliveira',
              },
              documentNumber: {
                type: 'string',
                example: '98765432100',
              },
              accountBranch: {
                type: 'string',
                example: '0001',
              },
              accountNumber: {
                type: 'string',
                example: '654321',
              },
              accountType: {
                type: 'string',
                example: 'CHECKING',
              },
              bankCompe: {
                type: 'string',
                example: '341',
              },
              bankName: {
                type: 'string',
                example: 'Itaú',
              },
            },
          },
          providerCreatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2026-01-17T10:00:00.000Z',
            description: 'Data/hora de criação no provedor',
            nullable: true,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2026-01-17T10:00:00.000Z',
            description: 'Data/hora de criação no sistema',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2026-01-17T10:05:00.000Z',
            description: 'Data/hora da última atualização',
          },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Token de autenticação inválido ou expirado',
    }),
    ApiResponse({
      status: 403,
      description: 'Sem permissão para visualizar esta transferência',
    }),
    ApiResponse({
      status: 404,
      description: 'Transferência TED não encontrada',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 404 },
          message: {
            type: 'string',
            example: 'Transferência TED não encontrada',
          },
          errorCode: { type: 'string', example: 'TED_TRANSFER_NOT_FOUND' },
        },
      },
    }),
  );
}
