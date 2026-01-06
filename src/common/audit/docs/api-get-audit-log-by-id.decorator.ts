import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AuditLog } from '../entities/audit-log.entity';

export function ApiGetAuditLogById() {
  return applyDecorators(
    ApiOperation({ summary: 'Buscar log de auditoria por ID' }),
    ApiParam({
      name: 'id',
      description: 'ID do log de auditoria',
      type: String,
      format: 'uuid',
      example: '9b520d8b-c836-42dd-90da-9a98e7f006fc',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Log de auditoria encontrado com sucesso',
      type: AuditLog,
      example: {
        id: '9b520d8b-c836-42dd-90da-9a98e7f006fc',
        action: 'USER_CREATED',
        entityType: 'User',
        entityId: '44f66582-641f-40cf-a9ac-4f661afb9a54',
        userId: '0886d835-bb67-4085-9e33-69e36c040933',
        username: 'admin',
        correlationId: '206285ed-eb73-48da-a58f-012960bbc3e4',
        oldValues: null,
        newValues: {
          id: '44f66582-641f-40cf-a9ac-4f661afb9a54',
          status: 'Active',
          username: 'admin',
        },
        ipAddress: '::1',
        userAgent: 'Apidog/1.0.0 (https://apidog.com)',
        description: 'Created a user',
        status: 'Success',
        errorMessage: null,
        errorCode: null,
        createdAt: '2025-11-08T01:37:33.000Z',
      },
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Log de auditoria não encontrado',
      schema: {
        type: 'object',
        properties: {
          erroCode: {
            type: 'string',
            example: 'AUDIT_LOG_NOT_FOUND',
          },
          message: {
            type: 'string',
            example: 'Audit log with ID {id} not found.',
          },
          correlationId: {
            type: 'string',
            example: '9afe65e8-a787-4bd5-8f71-db7074117352',
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
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
