import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { BankLoginDto } from '../dto/bank-login.dto';

export function ApiBankLogin() {
    return applyDecorators(
        ApiOperation({
            summary: 'Autenticar usuário para operações bancárias',
            description:
                'Realiza a autenticação de um usuário final para operações bancárias no Hiperbanco. ' +
                'O documento (CPF/CNPJ) e senha são fornecidos pela requisição e validados diretamente na API do provedor.',
        }),
        ApiBody({ type: BankLoginDto }),
        ApiResponse({
            status: 200,
            description: 'Login realizado com sucesso',
            schema: {
                type: 'object',
                properties: {
                    token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                    user: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', example: 'user-id-123' },
                            name: { type: 'string', example: 'João Silva' },
                        },
                    },
                },
            },
        }),
        ApiResponse({
            status: 401,
            description: 'Credenciais inválidas',
            schema: {
                type: 'object',
                properties: {
                    errorCode: { type: 'string', example: 'PROVIDER_AUTH_FAILED' },
                    message: { type: 'string', example: 'Falha na autenticação bancária Hiperbanco: Invalid credentials' },
                },
            },
        }),
    );
}
