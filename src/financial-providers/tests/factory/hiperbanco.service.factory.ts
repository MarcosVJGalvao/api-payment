import { Test } from '@nestjs/testing';
import { HiperbancoHttpService } from '../../hiperbanco/hiperbanco-http.service';
import { HiperbancoAuthService } from '../../hiperbanco/hiperbanco-auth.service';
import { FinancialCredentialsService } from '../../services/financial-credentials.service';
import { ProviderSessionService } from '../../services/provider-session.service';
import { ProviderJwtService } from '../../services/provider-jwt.service';
import { AppLoggerService } from '@/common/logger/logger.service';
import { AccountService } from '@/account/account.service';
import { OnboardingService } from '@/onboarding/onboarding.service';

/**
 * Factory para criar o módulo de teste do HiperbancoAuthService.
 */
export const createHiperbancoAuthTestFactory = async () => {
  const httpServiceMock = {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    getClientId: jest.fn().mockReturnValue('env-client-id'),
  };

  const credentialsServiceMock = {
    getDecryptedCredentials: jest.fn(),
    getPublicCredentials: jest.fn(),
    saveCredentials: jest.fn(),
  };

  const sessionServiceMock = {
    createSession: jest.fn().mockImplementation((data) =>
      Promise.resolve({
        sessionId: 'mock-session-id',
        ...data,
      }),
    ),
    getSession: jest.fn(),
    deleteSession: jest.fn(),
  };

  const jwtServiceMock = {
    generateToken: jest.fn().mockReturnValue('mock-jwt-token'),
    verifyToken: jest.fn(),
  };

  const loggerMock = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };

  const accountServiceMock = {
    createOrUpdate: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    validateAccountBelongsToClient: jest.fn(),
  };

  const onboardingServiceMock = {
    createOrUpdate: jest.fn(),
    findById: jest.fn(),
  };

  const configMock = {
    clientId: 'env-client-id',
    baseUrl: 'https://api.hiperbanco.com',
  };

  const module = await Test.createTestingModule({
    providers: [
      HiperbancoAuthService,
      { provide: HiperbancoHttpService, useValue: httpServiceMock },
      {
        provide: FinancialCredentialsService,
        useValue: credentialsServiceMock,
      },
      { provide: ProviderSessionService, useValue: sessionServiceMock },
      { provide: ProviderJwtService, useValue: jwtServiceMock },
      { provide: AppLoggerService, useValue: loggerMock },
      { provide: AccountService, useValue: accountServiceMock },
      { provide: OnboardingService, useValue: onboardingServiceMock },
      { provide: 'HIPERBANCO_CONFIG', useValue: configMock },
    ],
  }).compile();

  return {
    service: module.get<HiperbancoAuthService>(HiperbancoAuthService),
    httpServiceMock,
    credentialsServiceMock,
    sessionServiceMock,
    jwtServiceMock,
    loggerMock,
    accountServiceMock,
    onboardingServiceMock,
  };
};
