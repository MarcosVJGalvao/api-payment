import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { PixTransferDto } from '../dto/pix-transfer.dto';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';

export function ApiPixTransfer() {
  return applyDecorators(
    ApiOperation({ summary: 'Realizar transferência PIX' }),
    ApiParam({
      name: 'provider',
      description: 'Provedor financeiro',
      example: FinancialProvider.HIPERBANCO,
      enum: FinancialProvider,
    }),
    ApiBody({
      type: PixTransferDto,
      examples: {
        'Transferência por Chave/EndToEndId': {
          value: {
            amount: 100.5,
            initializationType: 'Key',
            description: 'Pagamento Serviço',
            endToEndId: 'E13140088202507090058341B5EC16CC',
            pixKey: '47742663023',
          } as PixTransferDto,
        },
        'Transferência via Static QR Code': {
          value: {
            amount: 50.0,
            initializationType: 'StaticQrCode',
            description: 'Pagamento QR Code Estático',
            endToEndId: 'E13140088202507090058341B5EC16CC',
            pixKey: '47742663023',
            conciliationId: 'FiCapc7D0Ul7KHDOnZp8HGaCS',
          } as PixTransferDto,
        },
        'Transferência via Dynamic QR Code': {
          value: {
            amount: 75.25,
            initializationType: 'DynamicQrCode',
            description: 'Pagamento QR Code Dinâmico',
            endToEndId: 'E13140088202507090058341B5EC16CC',
            pixKey: '47742663023',
            receiverReconciliationId: 'Jk6GDZxqDD0HizWOfIYxGosIn9',
          } as PixTransferDto,
        },
        'Transferência Manual (Agência e Conta)': {
          value: {
            amount: 1500.0,
            initializationType: 'Manual',
            description: 'Transferência para Conta Corrente',
            recipient: {
              name: 'Alberto Gilberto',
              documentNumber: '52145638795',
              account: {
                branch: '0001',
                number: '1101263307',
                type: 'CHECKING',
              },
              bank: {
                ispb: '13140088',
              },
            },
          } as PixTransferDto,
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Transferência realizada com sucesso',
      schema: {
        type: 'object',
        properties: {
          transactionId: { type: 'string', example: 'uuid' },
          status: { type: 'string', example: 'PROCESSING' },
          amount: { type: 'number', example: 100.5 },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Erro na transferência ou saldo insuficiente',
    }),
    ApiResponse({
      status: 403,
      description: 'Operação não permitida',
    }),
  );
}
