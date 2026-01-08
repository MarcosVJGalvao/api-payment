import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

export function ApiCreateBoleto() {
    return applyDecorators(
        ApiBearerAuth(),
        ApiOperation({
            summary: 'Emitir boleto',
            description: 'Emite um novo boleto no provedor financeiro especificado. Suporta dois tipos: Deposit (depósito) e Levy (cobrança).',
        }),
        ApiResponse({
            status: 201,
            description: 'Boleto emitido com sucesso',
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
