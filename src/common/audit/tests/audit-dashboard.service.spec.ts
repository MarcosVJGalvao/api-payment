import { Test, TestingModule } from '@nestjs/testing';
import { AuditDashboardService } from '../services/audit-dashboard.service';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { AuditLog } from '../entities/audit-log.entity';
import { AuditLogStatus } from '../enums/audit-log-status.enum';
import { AuditAction } from '../enums/audit-action.enum';
import { AuditDashboardQueryDto } from '../dto/audit-dashboard.dto';

describe('AuditDashboardService', () => {
  let service: AuditDashboardService;
  let repository: jest.Mocked<AuditLogRepository>;

  const mockAuditLogs: AuditLog[] = [
    {
      id: '1',
      action: AuditAction.USER_CREATED,
      entityType: 'User',
      entityId: 'user-1',
      userId: 'user-1',
      username: 'marcos',
      correlationId: 'corr-1',
      status: AuditLogStatus.SUCCESS,
      description: 'Created user',
      createdAt: new Date('2025-11-16T14:00:00.000Z'),
    } as AuditLog,
    {
      id: '2',
      action: AuditAction.USER_LOGIN,
      entityType: 'User',
      entityId: undefined,
      userId: 'user-1',
      username: 'marcos',
      correlationId: 'corr-2',
      status: AuditLogStatus.SUCCESS,
      description: 'Logged in',
      createdAt: new Date('2025-11-16T15:00:00.000Z'),
    } as AuditLog,
    {
      id: '3',
      action: AuditAction.USER_LOGIN_FAILED,
      entityType: 'User',
      entityId: undefined,
      userId: undefined,
      username: undefined,
      correlationId: 'corr-3',
      status: AuditLogStatus.FAILURE,
      description: 'Login failed',
      createdAt: new Date('2025-11-16T16:00:00.000Z'),
    } as AuditLog,
  ];

  beforeEach(async () => {
    const mockRepository = {
      findAllForStats: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditDashboardService,
        {
          provide: AuditLogRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AuditDashboardService>(AuditDashboardService);
    repository = module.get(AuditLogRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardStats', () => {
    it('should return dashboard statistics without data and meta', async () => {
      const queryDto: AuditDashboardQueryDto = {
        startDate: '2025-11-01T00:00:00.000Z',
        endDate: '2025-11-30T23:59:59.999Z',
        recentActivityLimit: 10,
      };

      repository.findAllForStats.mockResolvedValue(mockAuditLogs);

      const result = await service.getDashboardStats(queryDto);

      expect(result).toHaveProperty('statistics');
      expect(result).not.toHaveProperty('data');
      expect(result).not.toHaveProperty('meta');

      expect(result.statistics).toHaveProperty('totalLogs');
      expect(result.statistics).toHaveProperty('successLogs');
      expect(result.statistics).toHaveProperty('failureLogs');
      expect(result.statistics).toHaveProperty('successRate');
      expect(result.statistics).toHaveProperty('failureRate');
      expect(result.statistics).toHaveProperty('actionsByType');
      expect(result.statistics).toHaveProperty('actionsByDay');
      expect(result.statistics).toHaveProperty('actionsByHour');
      expect(result.statistics).toHaveProperty('topUsers');
      expect(result.statistics).toHaveProperty('topEntityTypes');
      expect(result.statistics).toHaveProperty('peakHours');
      expect(result.statistics).toHaveProperty('recentActivity');

      expect(result.statistics.totalLogs).toBe(3);
      expect(result.statistics.successLogs).toBe(2);
      expect(result.statistics.failureLogs).toBe(1);
      expect(result.statistics.successRate).toBeGreaterThan(0);
      expect(result.statistics.failureRate).toBeGreaterThan(0);
      expect(result.statistics.actionsByHour).toHaveLength(24);
      expect(result.statistics.recentActivity).toHaveLength(3);
    });

    it('should calculate success and failure rates correctly', async () => {
      const queryDto: AuditDashboardQueryDto = {};
      repository.findAllForStats.mockResolvedValue(mockAuditLogs);

      const result = await service.getDashboardStats(queryDto);

      expect(result.statistics.successRate).toBeCloseTo(66.67, 1);
      expect(result.statistics.failureRate).toBeCloseTo(33.33, 1);
    });

    it('should return top users correctly', async () => {
      const queryDto: AuditDashboardQueryDto = {};
      repository.findAllForStats.mockResolvedValue(mockAuditLogs);

      const result = await service.getDashboardStats(queryDto);

      expect(result.statistics.topUsers).toBeDefined();
      expect(Array.isArray(result.statistics.topUsers)).toBe(true);
      if (result.statistics.topUsers.length > 0) {
        expect(result.statistics.topUsers[0]).toHaveProperty('userId');
        expect(result.statistics.topUsers[0]).toHaveProperty('username');
        expect(result.statistics.topUsers[0]).toHaveProperty('count');
      }
    });

    it('should return top entity types correctly', async () => {
      const queryDto: AuditDashboardQueryDto = {};
      repository.findAllForStats.mockResolvedValue(mockAuditLogs);

      const result = await service.getDashboardStats(queryDto);

      expect(result.statistics.topEntityTypes).toBeDefined();
      expect(Array.isArray(result.statistics.topEntityTypes)).toBe(true);
      if (result.statistics.topEntityTypes.length > 0) {
        expect(result.statistics.topEntityTypes[0]).toHaveProperty(
          'entityType',
        );
        expect(result.statistics.topEntityTypes[0]).toHaveProperty('count');
      }
    });

    it('should return actions by hour with all 24 hours', async () => {
      const queryDto: AuditDashboardQueryDto = {};
      repository.findAllForStats.mockResolvedValue(mockAuditLogs);

      const result = await service.getDashboardStats(queryDto);

      expect(result.statistics.actionsByHour).toHaveLength(24);
      expect(result.statistics.actionsByHour[0]).toHaveProperty('hour');
      expect(result.statistics.actionsByHour[0]).toHaveProperty('count');
    });

    it('should respect recentActivityLimit parameter', async () => {
      const queryDto: AuditDashboardQueryDto = {
        recentActivityLimit: 2,
      };
      repository.findAllForStats.mockResolvedValue(mockAuditLogs);

      const result = await service.getDashboardStats(queryDto);

      expect(result.statistics.recentActivity).toHaveLength(2);
    });

    it('should handle empty logs array', async () => {
      const queryDto: AuditDashboardQueryDto = {};
      repository.findAllForStats.mockResolvedValue([]);

      const result = await service.getDashboardStats(queryDto);

      expect(result.statistics.totalLogs).toBe(0);
      expect(result.statistics.successLogs).toBe(0);
      expect(result.statistics.failureLogs).toBe(0);
      expect(result.statistics.successRate).toBe(0);
      expect(result.statistics.failureRate).toBe(0);
      expect(result.statistics.actionsByHour).toHaveLength(24);
      expect(result.statistics.recentActivity).toHaveLength(0);
    });

    it('should handle errors and log them', async () => {
      const queryDto: AuditDashboardQueryDto = {};
      const error = new Error('Database error');
      repository.findAllForStats.mockRejectedValue(error);

      await expect(service.getDashboardStats(queryDto)).rejects.toThrow(
        'Database error',
      );
    });
  });
});
