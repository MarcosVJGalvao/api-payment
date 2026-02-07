import { Test, TestingModule } from '@nestjs/testing';
import { AuditInterceptor } from '../interceptors/audit.interceptor';
import { AuditService } from '../services/audit.service';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { getQueueToken } from '@nestjs/bull';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { AUDIT_KEY } from '../decorators/audit.decorator';
import { AuditAction } from '../enums/audit-action.enum';

describe('AuditInterceptor', () => {
  let interceptor: AuditInterceptor;
  let auditService: any;
  let reflector: any;
  let jwtService: any;
  let dataSource: any;
  let auditQueue: any;

  beforeEach(async () => {
    auditService = {
      log: jest.fn(),
      extractIpAddress: jest.fn().mockReturnValue('127.0.0.1'),
      extractUserAgent: jest.fn().mockReturnValue('jest-test'),
      extractEntityId: jest.fn().mockReturnValue('123'),
      extractAuditStatus: jest.fn().mockReturnValue('SUCCESS'),
      extractErrorMessage: jest.fn().mockReturnValue(null),
      extractErrorCode: jest.fn().mockReturnValue(null),
    };
    reflector = {
      get: jest.fn(),
    };
    jwtService = {
      decode: jest.fn(),
    };
    dataSource = {
      getMetadata: jest.fn(),
      getRepository: jest.fn(),
    };
    auditQueue = {
      add: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditInterceptor,
        { provide: AuditService, useValue: auditService },
        { provide: Reflector, useValue: reflector },
        { provide: JwtService, useValue: jwtService },
        { provide: DataSource, useValue: dataSource },
        { provide: getQueueToken('audit'), useValue: auditQueue },
      ],
    }).compile();

    interceptor = module.get<AuditInterceptor>(AuditInterceptor);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should add audit log to queue when audit options are present', async () => {
    const context = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          method: 'POST',
          url: '/test',
          body: {},
          headers: {},
          ip: '127.0.0.1',
        }),
        getResponse: jest.fn().mockReturnValue({
          statusCode: 201,
        }),
      }),
      getType: jest.fn().mockReturnValue('http'),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;

    const next = {
      handle: jest.fn().mockReturnValue(of({ data: 'test' })),
    } as unknown as CallHandler;

    reflector.get.mockReturnValue({
      action: AuditAction.USER_CREATED,
      entityType: 'User',
    });

    dataSource.getMetadata.mockReturnValue({
      columns: [],
      relations: [],
    });

    // Mock observable subscription
    await interceptor.intercept(context, next).toPromise();

    expect(reflector.get).toHaveBeenCalledWith(AUDIT_KEY, context.getHandler());
    expect(auditQueue.add).toHaveBeenCalledWith(
      'log',
      expect.objectContaining({
        action: AuditAction.USER_CREATED,
        entityType: 'User',
      }),
      expect.objectContaining({
        removeOnComplete: true,
      }),
    );
  });

  it('should skip audit when no audit options are present', async () => {
    const context = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({}),
      }),
      getHandler: jest.fn(),
    } as unknown as ExecutionContext;

    const next = {
      handle: jest.fn().mockReturnValue(of({ data: 'test' })),
    } as unknown as CallHandler;

    reflector.get.mockReturnValue(null);

    await interceptor.intercept(context, next).toPromise();

    expect(auditQueue.add).not.toHaveBeenCalled();
  });

  it('should use token identity when request user is missing', async () => {
    const context = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          method: 'POST',
          url: '/test',
          body: {},
          params: {},
          query: {},
          headers: {
            authorization: 'Bearer token',
          },
        }),
      }),
      getType: jest.fn().mockReturnValue('http'),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;

    const next = {
      handle: jest.fn().mockReturnValue(of({ data: 'test' })),
    } as unknown as CallHandler;

    reflector.get.mockReturnValue({
      action: AuditAction.USER_CREATED,
      entityType: 'User',
    });

    jwtService.decode.mockReturnValue({
      userId: 'token-user-id',
      username: 'token-user',
    });

    await interceptor.intercept(context, next).toPromise();

    expect(jwtService.decode).toHaveBeenCalledTimes(1);
    expect(auditQueue.add).toHaveBeenCalledWith(
      'log',
      expect.objectContaining({
        userId: 'token-user-id',
        username: 'token-user',
      }),
      expect.objectContaining({
        removeOnComplete: true,
      }),
    );
  });
});
