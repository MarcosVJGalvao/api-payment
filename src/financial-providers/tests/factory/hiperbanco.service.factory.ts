import { Test } from '@nestjs/testing';
import { HiperbancoHttpService } from '../../hiperbanco/hiperbanco-http.service';
import { HiperbancoAuthService } from '../../hiperbanco/hiperbanco-auth.service';
import { FinancialCredentialsService } from '../../services/financial-credentials.service';
import { AppLoggerService } from '@/common/logger/logger.service';

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

    const loggerMock = {
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        verbose: jest.fn(),
    };

    const module = await Test.createTestingModule({
        providers: [
            HiperbancoAuthService,
            { provide: HiperbancoHttpService, useValue: httpServiceMock },
            { provide: FinancialCredentialsService, useValue: credentialsServiceMock },
            { provide: AppLoggerService, useValue: loggerMock },
        ],
    }).compile();

    return {
        service: module.get<HiperbancoAuthService>(HiperbancoAuthService),
        httpServiceMock,
        credentialsServiceMock,
        loggerMock,
    };
};
