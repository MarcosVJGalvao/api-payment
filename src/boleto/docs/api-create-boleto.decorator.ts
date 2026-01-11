import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CreateBoletoDto } from '../dto/create-boleto.dto';

export function ApiCreateBoleto() {
  return applyDecorators(
    ApiBody({
      type: CreateBoletoDto,
      examples: {
        'Boleto de Depósito': {
          value: {
            alias: 'Depósito na conta',
            type: 'Deposit',
            amount: 500.0,
            dueDate: '2025-10-10',
            documentNumber: '12345678909',
            account: {
              branch: '0001',
              number: '123456',
              type: 'CHECKING',
            },
          } as CreateBoletoDto,
        },
        'Boleto de Cobrança (Levy)': {
          value: {
            alias: 'Cobrança de Serviços',
            type: 'Levy',
            amount: 150.75,
            dueDate: '2025-10-15',
            closePayment: '2025-11-15',
            documentNumber: '09876543210',
            account: {
              branch: '0001',
              number: '654321',
              type: 'CHECKING',
            },
            payer: {
              name: 'João da Silva',
              document: '11122233344',
              address: {
                zipCode: '01001000',
                street: 'Praça da Sé',
                number: '1',
                addressLine: 'Rua Major Amarante',
                neighborhood: 'Centro',
                city: 'São Paulo',
                state: 'SP',
              },
            },
            interest: {
              value: 1.0,
              startDate: '2025-10-16',
              type: 'Percent' as any,
            },
            fine: {
              value: 2.0,
              startDate: '2025-10-16',
              type: 'FixedAmount' as any,
            },
            discount: {
              value: 5.0,
              limitDate: '2025-10-10',
              type: 'FixedAmount' as any,
            },
          } as CreateBoletoDto,
        },
      },
    }),
    ApiOperation({
      summary: 'Emitir boleto',
      description:
        'Emite um novo boleto no provedor financeiro especificado. Suporta dois tipos: Deposit (depósito) e Levy (cobrança).',
    }),
    ApiResponse({
      status: 201,
      description:
        'Boleto emitido com sucesso. Retorna os dados do provedor financeiro mais o campo internalId (ID gerado pelo banco de dados).',
    }),
    ApiResponse({
      status: 400,
      description: 'Dados inválidos ou validação falhou',
    }),
    ApiResponse({
      status: 401,
      description: 'Não autenticado',
    }),
    ApiResponse({
      status: 422,
      description: 'Erro de validação de regras de negócio',
    }),
    ApiResponse({
      status: 502,
      description: 'Erro na comunicação com o provedor financeiro',
    }),
    ApiResponse({
      status: 500,
      description: 'Erro interno do servidor',
    }),
  );
}
