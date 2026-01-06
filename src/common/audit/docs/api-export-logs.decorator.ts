import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiProduces } from '@nestjs/swagger';

export function ApiExportLogs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Exportar logs de auditoria',
      description:
        'Exporta os logs de auditoria no formato especificado (JSON ou CSV). O arquivo será baixado automaticamente pelo navegador. O formato é determinado pelo parâmetro `format` na query string.',
    }),
    ApiProduces('application/json', 'text/csv'),
    ApiResponse({
      status: 200,
      description:
        'Logs de auditoria exportados com sucesso. Para formato JSON, retorna um array de objetos AuditLog. Para formato CSV, retorna uma string CSV. O arquivo será baixado automaticamente pelo navegador.',
      content: {
        'application/json; charset=utf-8': {
          schema: {
            type: 'array',
            description: 'Array de logs de auditoria em formato JSON',
            items: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  format: 'uuid',
                  example: '1fd44aa5-3a1d-4a36-bd6a-7e86706652cd',
                },
                action: {
                  type: 'string',
                  enum: [
                    'USER_CREATED',
                    'USER_UPDATED',
                    'USER_DELETED',
                    'USER_STATUS_CHANGED',
                    'USER_PASSWORD_CHANGED',
                    'USER_VIEWED',
                    'USER_LOGIN',
                    'USER_LOGOUT',
                    'USER_LOGIN_FAILED',
                    'PERMISSION_GRANTED',
                    'PERMISSION_REVOKED',
                    'ROLE_ASSIGNED',
                    'ROLE_REMOVED',
                    'EMPLOYEE_CREATED',
                    'EMPLOYEE_UPDATED',
                    'EMPLOYEE_DELETED',
                  ],
                  example: 'USER_LOGIN',
                },
                entityType: {
                  type: 'string',
                  example: 'User',
                },
                entityId: {
                  type: 'string',
                  format: 'uuid',
                  nullable: true,
                  example: null,
                },
                userId: {
                  type: 'string',
                  format: 'uuid',
                  nullable: true,
                  example: '0886d835-bb67-4085-9e33-69e36c040933',
                },
                username: {
                  type: 'string',
                  nullable: true,
                  example: 'marcos',
                },
                correlationId: {
                  type: 'string',
                  format: 'uuid',
                  nullable: true,
                  example: '0abf8d12-fd42-451b-ae78-de76a6a8f536',
                },
                oldValues: {
                  type: 'object',
                  nullable: true,
                  example: null,
                },
                newValues: {
                  type: 'object',
                  nullable: true,
                  example: {
                    username: 'marcos',
                  },
                },
                ipAddress: {
                  type: 'string',
                  nullable: true,
                  example: '::1',
                },
                userAgent: {
                  type: 'string',
                  nullable: true,
                  example: 'Apidog/1.0.0 (https://apidog.com)',
                },
                description: {
                  type: 'string',
                  nullable: true,
                  example: 'Logged in',
                },
                status: {
                  type: 'string',
                  enum: ['SUCCESS', 'FAILURE'],
                  example: 'SUCCESS',
                },
                errorMessage: {
                  type: 'string',
                  nullable: true,
                  example: null,
                },
                errorCode: {
                  type: 'string',
                  nullable: true,
                  example: null,
                },
                createdAt: {
                  type: 'string',
                  format: 'date-time',
                  example: '2025-11-10T01:00:20.000Z',
                },
              },
            },
            example: [
              {
                id: '1fd44aa5-3a1d-4a36-bd6a-7e86706652cd',
                action: 'USER_LOGIN',
                entityType: 'User',
                entityId: null,
                userId: '0886d835-bb67-4085-9e33-69e36c040933',
                username: 'marcos',
                correlationId: '0abf8d12-fd42-451b-ae78-de76a6a8f536',
                oldValues: null,
                newValues: {
                  username: 'marcos',
                },
                ipAddress: '::1',
                userAgent: 'Apidog/1.0.0 (https://apidog.com)',
                description: 'Logged in',
                status: 'SUCCESS',
                errorMessage: null,
                errorCode: null,
                createdAt: '2025-11-10T01:00:20.000Z',
              },
              {
                id: '39480963-065d-4831-8ede-102bd742f184',
                action: 'USER_LOGIN_FAILED',
                entityType: 'User',
                entityId: null,
                userId: null,
                username: 'marcos',
                correlationId: '7d5192ac-9c4e-453b-ae1b-f2aa17fca9af',
                oldValues: null,
                newValues: {
                  username: 'marcos',
                },
                ipAddress: '::1',
                userAgent: 'Apidog/1.0.0 (https://apidog.com)',
                description: 'Logged in',
                status: 'FAILURE',
                errorMessage: 'Invalid credentials.',
                errorCode: 'INVALID_CREDENTIALS',
                createdAt: '2025-11-10T01:00:17.000Z',
              },
            ],
          },
        },
        'text/csv; charset=utf-8': {
          schema: {
            type: 'string',
            description:
              'Conteúdo do arquivo CSV com os logs de auditoria (headers + dados)',
            example: `"id","action","entityType","entityId","userId","username","correlationId","oldValues","newValues","ipAddress","userAgent","description","status","errorMessage","errorCode","createdAt"
"1fd44aa5-3a1d-4a36-bd6a-7e86706652cd","USER_LOGIN","User","","0886d835-bb67-4085-9e33-69e36c040933","marcos","0abf8d12-fd42-451b-ae78-de76a6a8f536","","{""username"":""marcos""}","::1","Apidog/1.0.0 (https://apidog.com)","Logged in","SUCCESS","","","2025-11-10T01:00:20.000Z"
"39480963-065d-4831-8ede-102bd742f184","USER_LOGIN_FAILED","User","","","marcos","7d5192ac-9c4e-453b-ae1b-f2aa17fca9af","","{""username"":""marcos""}","::1","Apidog/1.0.0 (https://apidog.com)","Logged in","FAILURE","Invalid credentials.","INVALID_CREDENTIALS","2025-11-10T01:00:17.000Z"`,
          },
        },
      },
      headers: {
        'Content-Type': {
          description:
            'Tipo MIME do conteúdo: application/json; charset=utf-8 (para JSON) ou text/csv; charset=utf-8 (para CSV)',
          schema: {
            type: 'string',
            example: 'application/json; charset=utf-8',
          },
        },
        'Content-Disposition': {
          description:
            'Header que indica que o conteúdo deve ser baixado como arquivo. O nome do arquivo segue o padrão: audit-logs-YYYY-MM-DDTHH-MM-SS.extensão (onde os dois-pontos são substituídos por hífens)',
          schema: {
            type: 'string',
            example:
              'attachment; filename="audit-logs-2025-11-08T01-37-33.json"',
          },
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Permissão negada',
      schema: {
        type: 'object',
        properties: {
          erroCode: {
            type: 'string',
            example: 'PERMISSION_DENIED',
          },
          message: {
            type: 'string',
            example: 'Permission denied.',
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
