import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ProviderCredential } from '../entities/provider-credential.entity';
import { ProviderLoginType } from '../enums/provider-login-type.enum';

export function ApiGetProviderConfig() {
    return applyDecorators(
        ApiOperation({
            summary: 'Obter configuração atual de um provedor financeiro',
            description:
                'Retorna as credenciais configuradas para um provedor financeiro. ' +
                'A senha é automaticamente ocultada na resposta por questões de segurança.',
        }),
        ApiParam({
            name: 'provider',
            description: 'Slug identificador do provedor financeiro',
            example: 'hiperbanco',
            required: true,
        }),
        ApiParam({
            name: 'loginType',
            description: 'Tipo de login: backoffice (email/senha) ou bank (documento/senha)',
            enum: ProviderLoginType,
            example: ProviderLoginType.BACKOFFICE,
            required: true,
        }),
        ApiResponse({
            status: 200,
            description: 'Configuração do provedor retornada com sucesso',
            type: ProviderCredential,
        }),
        ApiResponse({
            status: 404,
            description: 'Provedor não encontrado',
            schema: {
                type: 'object',
                properties: {
                    errorCode: {
                        type: 'string',
                        example: 'PROVIDER_CREDENTIALS_NOT_FOUND',
                    },
                    message: {
                        type: 'string',
                        example: 'Credenciais do provedor hiperbanco não encontradas',
                    },
                    correlationId: {
                        type: 'string',
                        example: '9afe65e8-a787-4bd5-8f71-db7074117352',
                    },
                },
            },
        }),
    );
}
