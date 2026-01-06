import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiGetDashboard() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obter estatísticas do dashboard de auditoria',
      description:
        'Retorna estatísticas agregadas e métricas relevantes para visualização em dashboard. Não retorna lista paginada de logs - use GET /audit para listar logs com paginação.',
    }),
    ApiResponse({
      status: 200,
      description: 'Estatísticas do dashboard retornadas com sucesso',
      schema: {
        type: 'object',
        properties: {
          statistics: {
            type: 'object',
            description: 'Estatísticas e métricas do dashboard de auditoria',
            properties: {
              totalLogs: {
                type: 'number',
                description:
                  'Total de logs encontrados (considerando filtros de data)',
                example: 100,
              },
              successLogs: {
                type: 'number',
                description: 'Total de logs com status SUCCESS',
                example: 95,
              },
              failureLogs: {
                type: 'number',
                description: 'Total de logs com status FAILURE',
                example: 5,
              },
              successRate: {
                type: 'number',
                description: 'Percentual de sucesso (0-100)',
                example: 95.0,
              },
              failureRate: {
                type: 'number',
                description: 'Percentual de falha (0-100)',
                example: 5.0,
              },
              actionsByType: {
                type: 'object',
                description: 'Contagem de ações agrupadas por tipo',
                additionalProperties: {
                  type: 'number',
                },
                example: {
                  USER_CREATED: 20,
                  USER_UPDATED: 30,
                  USER_DELETED: 5,
                  USER_LOGIN: 40,
                },
              },
              actionsByDay: {
                type: 'array',
                description: 'Contagem de ações agrupadas por dia',
                items: {
                  type: 'object',
                  properties: {
                    date: {
                      type: 'string',
                      format: 'date',
                      example: '2025-11-08',
                    },
                    count: {
                      type: 'number',
                      example: 15,
                    },
                  },
                },
                example: [
                  { date: '2025-11-08', count: 15 },
                  { date: '2025-11-09', count: 20 },
                ],
              },
              actionsByHour: {
                type: 'array',
                description:
                  'Distribuição de ações por hora do dia (0-23). Sempre retorna todas as 24 horas.',
                items: {
                  type: 'object',
                  properties: {
                    hour: {
                      type: 'number',
                      minimum: 0,
                      maximum: 23,
                      example: 14,
                    },
                    count: {
                      type: 'number',
                      example: 25,
                    },
                  },
                },
                example: [
                  { hour: 0, count: 5 },
                  { hour: 1, count: 3 },
                  { hour: 14, count: 25 },
                ],
              },
              topUsers: {
                type: 'array',
                description: 'Top 10 usuários com mais ações',
                items: {
                  type: 'object',
                  properties: {
                    userId: {
                      type: 'string',
                      format: 'uuid',
                      example: '0886d835-bb67-4085-9e33-69e36c040933',
                    },
                    username: {
                      type: 'string',
                      example: 'marcos',
                    },
                    count: {
                      type: 'number',
                      description: 'Número de ações realizadas pelo usuário',
                      example: 25,
                    },
                  },
                },
                example: [
                  {
                    userId: '0886d835-bb67-4085-9e33-69e36c040933',
                    username: 'marcos',
                    count: 25,
                  },
                ],
              },
              topEntityTypes: {
                type: 'array',
                description: 'Top 10 tipos de entidades mais acessadas',
                items: {
                  type: 'object',
                  properties: {
                    entityType: {
                      type: 'string',
                      example: 'User',
                    },
                    count: {
                      type: 'number',
                      description: 'Número de ações realizadas nesta entidade',
                      example: 50,
                    },
                  },
                },
                example: [
                  { entityType: 'User', count: 50 },
                  { entityType: 'Student', count: 30 },
                ],
              },
              peakHours: {
                type: 'array',
                description: 'Top 5 horários de pico de atividade',
                items: {
                  type: 'object',
                  properties: {
                    hour: {
                      type: 'number',
                      minimum: 0,
                      maximum: 23,
                      example: 14,
                    },
                    count: {
                      type: 'number',
                      example: 45,
                    },
                  },
                },
                example: [
                  { hour: 14, count: 45 },
                  { hour: 15, count: 38 },
                ],
              },
              recentActivity: {
                type: 'array',
                description:
                  'Últimos N logs de auditoria (resumo simplificado). Quantidade controlada por recentActivityLimit (padrão: 10).',
                items: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                      format: 'uuid',
                      example: '9b520d8b-c836-42dd-90da-9a98e7f006fc',
                    },
                    action: {
                      type: 'string',
                      example: 'USER_CREATED',
                    },
                    entityType: {
                      type: 'string',
                      example: 'User',
                    },
                    username: {
                      type: 'string',
                      nullable: true,
                      example: 'marcos',
                    },
                    correlationId: {
                      type: 'string',
                      nullable: true,
                      example: '206285ed-eb73-48da-a58f-012960bbc3e4',
                    },
                    status: {
                      type: 'string',
                      enum: ['Success', 'Failure'],
                      example: 'Success',
                    },
                    description: {
                      type: 'string',
                      nullable: true,
                      example: 'Created a user',
                    },
                    createdAt: {
                      type: 'string',
                      format: 'date-time',
                      example: '2025-11-10T00:01:12.000Z',
                    },
                  },
                },
                example: [
                  {
                    id: '9b520d8b-c836-42dd-90da-9a98e7f006fc',
                    action: 'USER_CREATED',
                    entityType: 'User',
                    username: 'marcos',
                    correlationId: '206285ed-eb73-48da-a58f-012960bbc3e4',
                    status: 'Success',
                    description: 'Created a user',
                    createdAt: '2025-11-10T00:01:12.000Z',
                  },
                ],
              },
            },
          },
        },
      },
      example: {
        statistics: {
          totalLogs: 100,
          successLogs: 95,
          failureLogs: 5,
          successRate: 95.0,
          failureRate: 5.0,
          actionsByType: {
            USER_CREATED: 20,
            USER_UPDATED: 30,
            USER_DELETED: 5,
            USER_LOGIN: 40,
          },
          actionsByDay: [
            { date: '2025-11-08', count: 15 },
            { date: '2025-11-09', count: 20 },
          ],
          actionsByHour: [
            { hour: 0, count: 5 },
            { hour: 1, count: 3 },
            { hour: 14, count: 25 },
          ],
          topUsers: [
            {
              userId: '0886d835-bb67-4085-9e33-69e36c040933',
              username: 'marcos',
              count: 25,
            },
          ],
          topEntityTypes: [
            { entityType: 'User', count: 50 },
            { entityType: 'Student', count: 30 },
          ],
          peakHours: [
            { hour: 14, count: 45 },
            { hour: 15, count: 38 },
          ],
          recentActivity: [
            {
              id: '9b520d8b-c836-42dd-90da-9a98e7f006fc',
              action: 'USER_CREATED',
              entityType: 'User',
              username: 'marcos',
              correlationId: '206285ed-eb73-48da-a58f-012960bbc3e4',
              status: 'Success',
              description: 'Created a user',
              createdAt: '2025-11-10T00:01:12.000Z',
            },
          ],
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
