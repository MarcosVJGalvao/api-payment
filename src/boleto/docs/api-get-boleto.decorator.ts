import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

export function ApiGetBoleto() {
    return applyDecorators(
        ApiBearerAuth(),
        ApiOperation({
            summary: 'Consultar boleto por ID',
            description: 'Retorna os dados completos de um boleto pelo seu ID.',
        }),
        ApiParam({
            name: 'id',
            description: 'ID do boleto',
            type: String,
        }),
        ApiResponse({
            status: 200,
            description: 'Boleto encontrado',
        }),
        ApiResponse({
            status: 400,
            description: 'ID inválido',
        }),
        ApiResponse({
            status: 401,
            description: 'Não autenticado',
        }),
        ApiResponse({
            status: 404,
            description: 'Boleto não encontrado',
        }),
    );
}
