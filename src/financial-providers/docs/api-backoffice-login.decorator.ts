import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { BackofficeLoginDto } from '../dto/backoffice-login.dto';

export function ApiBackofficeLogin() {
    return applyDecorators(
        ApiOperation({
            summary: 'Autenticar com o Backoffice do Hiperbanco',
            description:
                'Realiza a autenticação de um usuário backoffice no Hiperbanco. ' +
                'Retorna um token JWT interno para uso nas demais operações.',
        }),
        ApiBody({ type: BackofficeLoginDto }),
        ApiResponse({
            status: 200,
            description: 'Login realizado com sucesso',
            schema: {
                type: 'object',
                properties: {
                    access_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                    sessionId: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
                },
            },
        }),
        ApiResponse({
            status: 401,
            description: 'Falha na autenticação',
            schema: {
                type: 'object',
                properties: {
                    errorCode: { type: 'string', example: 'PROVIDER_AUTH_FAILED' },
                    message: { type: 'string', example: 'Hiperbanco authentication failed: Invalid credentials' },
                },
            },
        }),
    );
}
