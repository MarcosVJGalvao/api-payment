import { HttpStatus } from '@nestjs/common';
import { AuditService } from '../services/audit.service';
import { createAuditServiceTestFactory } from './factory/audit.service.factory';
import {
  mockQueryAuditLogDto,
  mockAuditLog,
  mockPaginationResult,
} from './mocks/audit.mock';
import { AuditAction } from '../enums/audit-action.enum';
import { AuditLogStatus } from '../enums/audit-log-status.enum';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';

describe('AuditService', () => {
  let service: AuditService;
  let repositoryMock: any;
  let baseQueryServiceMock: any;

  beforeEach(async () => {
    const factory = await createAuditServiceTestFactory();
    service = factory.auditService;
    repositoryMock = factory.repositoryMock;
    baseQueryServiceMock = factory.baseQueryServiceMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllAuditLogs', () => {
    it('should successfully return paginated audit logs using BaseQueryService', async () => {
      const queryDto = mockQueryAuditLogDto();
      const mockQueryOptions = {
        page: 1,
        limit: 10,
        defaultSortBy: 'createdAt',
        dateField: 'createdAt',
        searchFields: [
          'username',
          'entityType',
          'description',
          'entityId',
          'userId',
          'correlationId',
        ],
        filters: [{ field: 'action' }],
      };
      const mockAuditLogEntity = mockAuditLog();
      const mockResult = mockPaginationResult([mockAuditLogEntity]);

      baseQueryServiceMock.buildQueryOptions.mockReturnValue(mockQueryOptions);
      baseQueryServiceMock.findAll.mockResolvedValue(mockResult);

      const result = await service.findAllAuditLogs(queryDto);

      expect(baseQueryServiceMock.buildQueryOptions).toHaveBeenCalledWith(
        repositoryMock,
        expect.objectContaining({
          ...queryDto,
          sortOrder: 'DESC',
        }),
        {
          defaultSortBy: 'createdAt',
          dateField: 'createdAt',
          searchFields: [
            'username',
            'entityType',
            'description',
            'entityId',
            'userId',
            'correlationId',
          ],
          filters: expect.arrayContaining([
            { field: 'action' },
            { field: 'status' },
          ]),
        },
      );
      expect(baseQueryServiceMock.findAll).toHaveBeenCalledWith(
        repositoryMock,
        mockQueryOptions,
      );
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        id: mockAuditLogEntity.id,
        action: mockAuditLogEntity.action,
        entityType: mockAuditLogEntity.entityType,
        username: mockAuditLogEntity.username,
        correlationId: mockAuditLogEntity.correlationId,
        status: mockAuditLogEntity.status,
        description: mockAuditLogEntity.description,
        createdAt: mockAuditLogEntity.createdAt,
      });
      expect(result.meta).toEqual(mockResult.meta);
      // Verificar que campos extras não estão presentes na listagem
      expect(result.data[0]).not.toHaveProperty('userId');
      expect(result.data[0]).not.toHaveProperty('entityId');
      expect(result.data[0]).not.toHaveProperty('oldValues');
      expect(result.data[0]).not.toHaveProperty('newValues');
      expect(result.data[0]).not.toHaveProperty('ipAddress');
      expect(result.data[0]).not.toHaveProperty('userAgent');
      expect(result.data[0]).not.toHaveProperty('errorMessage');
      expect(result.data[0]).not.toHaveProperty('errorCode');
    });

    it('should filter by action when action is provided', async () => {
      const queryDto = mockQueryAuditLogDto();
      queryDto.action = AuditAction.USER_CREATED;
      const mockQueryOptions = {
        page: 1,
        limit: 10,
        defaultSortBy: 'createdAt',
        dateField: 'createdAt',
        searchFields: [
          'username',
          'entityType',
          'description',
          'entityId',
          'userId',
          'correlationId',
        ],
        filters: [{ field: 'action' }],
      };
      const mockAuditLogEntity = mockAuditLog();
      const mockResult = mockPaginationResult([mockAuditLogEntity]);

      baseQueryServiceMock.buildQueryOptions.mockReturnValue(mockQueryOptions);
      baseQueryServiceMock.findAll.mockResolvedValue(mockResult);

      const result = await service.findAllAuditLogs(queryDto);

      expect(baseQueryServiceMock.buildQueryOptions).toHaveBeenCalledWith(
        repositoryMock,
        expect.objectContaining({
          ...queryDto,
          sortOrder: 'DESC',
        }),
        expect.objectContaining({
          searchFields: [
            'username',
            'entityType',
            'description',
            'entityId',
            'userId',
            'correlationId',
          ],
          filters: expect.arrayContaining([
            { field: 'action' },
            { field: 'status' },
          ]),
        }),
      );
      expect(result.data[0]).toMatchObject({
        id: mockAuditLogEntity.id,
        action: mockAuditLogEntity.action,
        entityType: mockAuditLogEntity.entityType,
        username: mockAuditLogEntity.username,
        correlationId: mockAuditLogEntity.correlationId,
        status: mockAuditLogEntity.status,
        description: mockAuditLogEntity.description,
        createdAt: mockAuditLogEntity.createdAt,
      });
      expect(result.meta).toEqual(mockResult.meta);
    });

    it('should filter by status when status is provided', async () => {
      const queryDto = mockQueryAuditLogDto();
      queryDto.status = AuditLogStatus.FAILURE;
      const mockQueryOptions = {
        page: 1,
        limit: 10,
        defaultSortBy: 'createdAt',
        dateField: 'createdAt',
        searchFields: [
          'username',
          'entityType',
          'description',
          'entityId',
          'userId',
          'correlationId',
        ],
        filters: [{ field: 'action' }, { field: 'status' }],
      };
      const mockAuditLogEntity = mockAuditLog();
      mockAuditLogEntity.status = AuditLogStatus.FAILURE;
      const mockResult = mockPaginationResult([mockAuditLogEntity]);

      baseQueryServiceMock.buildQueryOptions.mockReturnValue(mockQueryOptions);
      baseQueryServiceMock.findAll.mockResolvedValue(mockResult);

      const result = await service.findAllAuditLogs(queryDto);

      expect(baseQueryServiceMock.buildQueryOptions).toHaveBeenCalledWith(
        repositoryMock,
        expect.objectContaining({
          ...queryDto,
          sortOrder: 'DESC',
        }),
        expect.objectContaining({
          searchFields: [
            'username',
            'entityType',
            'description',
            'entityId',
            'userId',
            'correlationId',
          ],
          filters: expect.arrayContaining([
            { field: 'action' },
            { field: 'status' },
          ]),
        }),
      );
      expect(result.data[0]).toMatchObject({
        id: mockAuditLogEntity.id,
        action: mockAuditLogEntity.action,
        entityType: mockAuditLogEntity.entityType,
        username: mockAuditLogEntity.username,
        correlationId: mockAuditLogEntity.correlationId,
        status: AuditLogStatus.FAILURE,
        description: mockAuditLogEntity.description,
        createdAt: mockAuditLogEntity.createdAt,
      });
      expect(result.meta).toEqual(mockResult.meta);
    });

    it('should search across multiple fields when search parameter is provided', async () => {
      const queryDto = mockQueryAuditLogDto();
      queryDto.search = 'admin';
      const mockQueryOptions = {
        page: 1,
        limit: 10,
        defaultSortBy: 'createdAt',
        dateField: 'createdAt',
        search: 'admin',
        searchFields: [
          'username',
          'entityType',
          'description',
          'entityId',
          'userId',
          'correlationId',
        ],
        filters: [{ field: 'action' }],
      };
      const mockAuditLogEntity = mockAuditLog();
      const mockResult = mockPaginationResult([mockAuditLogEntity]);

      baseQueryServiceMock.buildQueryOptions.mockReturnValue(mockQueryOptions);
      baseQueryServiceMock.findAll.mockResolvedValue(mockResult);

      const result = await service.findAllAuditLogs(queryDto);

      expect(baseQueryServiceMock.buildQueryOptions).toHaveBeenCalledWith(
        repositoryMock,
        expect.objectContaining({
          ...queryDto,
          sortOrder: 'DESC',
        }),
        expect.objectContaining({
          searchFields: [
            'username',
            'entityType',
            'description',
            'entityId',
            'userId',
            'correlationId',
          ],
        }),
      );
      expect(result.data[0]).toMatchObject({
        id: mockAuditLogEntity.id,
        action: mockAuditLogEntity.action,
        entityType: mockAuditLogEntity.entityType,
        username: mockAuditLogEntity.username,
        correlationId: mockAuditLogEntity.correlationId,
        status: mockAuditLogEntity.status,
        description: mockAuditLogEntity.description,
        createdAt: mockAuditLogEntity.createdAt,
      });
      expect(result.meta).toEqual(mockResult.meta);
    });

    it('should handle search and action filter together', async () => {
      const queryDto = mockQueryAuditLogDto();
      queryDto.action = AuditAction.USER_CREATED;
      queryDto.search = 'admin';
      const mockQueryOptions = {
        page: 1,
        limit: 10,
        defaultSortBy: 'createdAt',
        dateField: 'createdAt',
        search: 'admin',
        searchFields: [
          'username',
          'entityType',
          'description',
          'entityId',
          'userId',
          'correlationId',
        ],
        filters: [{ field: 'action' }],
      };
      const mockAuditLogEntity = mockAuditLog();
      const mockResult = mockPaginationResult([mockAuditLogEntity]);

      baseQueryServiceMock.buildQueryOptions.mockReturnValue(mockQueryOptions);
      baseQueryServiceMock.findAll.mockResolvedValue(mockResult);

      const result = await service.findAllAuditLogs(queryDto);

      expect(baseQueryServiceMock.buildQueryOptions).toHaveBeenCalledWith(
        repositoryMock,
        expect.objectContaining({
          ...queryDto,
          sortOrder: 'DESC',
        }),
        expect.objectContaining({
          searchFields: [
            'username',
            'entityType',
            'description',
            'entityId',
            'userId',
            'correlationId',
          ],
          filters: expect.arrayContaining([
            { field: 'action' },
            { field: 'status' },
          ]),
        }),
      );
      expect(result.data[0]).toMatchObject({
        id: mockAuditLogEntity.id,
        action: mockAuditLogEntity.action,
        entityType: mockAuditLogEntity.entityType,
        username: mockAuditLogEntity.username,
        correlationId: mockAuditLogEntity.correlationId,
        status: mockAuditLogEntity.status,
        description: mockAuditLogEntity.description,
        createdAt: mockAuditLogEntity.createdAt,
      });
      expect(result.meta).toEqual(mockResult.meta);
    });
  });

  describe('getAuditLogById', () => {
    it('should successfully return an audit log by id', async () => {
      const auditLogId = '9b520d8b-c836-42dd-90da-9a98e7f006fc';
      const mockAuditLogEntity = mockAuditLog();
      mockAuditLogEntity.id = auditLogId;

      repositoryMock.findOne.mockResolvedValue(mockAuditLogEntity);

      const result = await service.getAuditLogById(auditLogId);

      expect(repositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: auditLogId },
      });
      expect(result).toEqual(mockAuditLogEntity);
    });

    it('should throw CustomHttpException when audit log is not found', async () => {
      const auditLogId = '9b520d8b-c836-42dd-90da-9a98e7f006fc';

      repositoryMock.findOne.mockResolvedValue(null);

      await expect(service.getAuditLogById(auditLogId)).rejects.toThrow(
        CustomHttpException,
      );

      try {
        await service.getAuditLogById(auditLogId);
      } catch (err: any) {
        expect(err.getStatus()).toBe(HttpStatus.NOT_FOUND);
        expect(err.errorCode).toBe(ErrorCode.AUDIT_LOG_NOT_FOUND);
        expect(err.customMessage).toContain(
          `Audit log with ID ${auditLogId} not found`,
        );
      }

      expect(repositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: auditLogId },
      });
    });
  });
});
