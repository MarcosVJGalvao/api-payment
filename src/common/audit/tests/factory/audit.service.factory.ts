import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditService } from '../../services/audit.service';
import { AuditLog } from '../../entities/audit-log.entity';
import { AuditLogRepository } from '../../repositories/audit-log.repository';
import { BaseQueryService } from '@/common/base-query/service/base-query.service';

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const mockAuditLogRepository = () => ({
  create: jest.fn(),
  createMany: jest.fn(),
  findByEntity: jest.fn(),
  findByUser: jest.fn(),
  findByAction: jest.fn(),
  findByCorrelationId: jest.fn(),
  findAllWithFilters: jest.fn(),
});

export const createAuditServiceTestFactory = async () => {
  const baseQueryServiceMock = {
    buildQueryOptions: jest.fn(),
    findAll: jest.fn(),
  };

  const module = await Test.createTestingModule({
    providers: [
      AuditService,
      {
        provide: getRepositoryToken(AuditLog),
        useValue: mockRepository(),
      },
      {
        provide: AuditLogRepository,
        useValue: mockAuditLogRepository(),
      },
      {
        provide: BaseQueryService,
        useValue: baseQueryServiceMock,
      },
    ],
  }).compile();

  return {
    auditService: module.get<AuditService>(AuditService),
    repositoryMock: module.get(getRepositoryToken(AuditLog)),
    auditLogRepositoryMock: module.get(AuditLogRepository),
    baseQueryServiceMock,
  };
};
