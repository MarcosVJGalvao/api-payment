import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

export function ApiListBoletos() {
    return applyDecorators(
        ApiBearerAuth(),
        ApiOperation({
            summary: 'Listar boletos',
            description: 'Lista boletos com paginação, filtros e busca. Permite filtrar por status, tipo e provedor.',
        }),
        ApiResponse({
            status: 200,
            description: 'Lista de boletos retornada com sucesso',
        }),
        ApiResponse({
            status: 400,
            description: 'Parâmetros de query inválidos',
        }),
        ApiResponse({
            status: 401,
            description: 'Não autenticado',
        }),
    );
}
