import { createHiperbancoAuthTestFactory } from './factory/hiperbanco.service.factory';
import { mockProviderCredential } from './mocks/hiperbanco.mock';
import { mockBackofficeLoginDto, mockBankLoginDto } from './mocks/hiperbanco-dto.mock';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';

describe('HiperbancoAuthService', () => {
    let service: Awaited<ReturnType<typeof createHiperbancoAuthTestFactory>>['service'];
    let httpServiceMock: Awaited<ReturnType<typeof createHiperbancoAuthTestFactory>>['httpServiceMock'];
    let credentialsServiceMock: Awaited<ReturnType<typeof createHiperbancoAuthTestFactory>>['credentialsServiceMock'];
    let sessionServiceMock: Awaited<ReturnType<typeof createHiperbancoAuthTestFactory>>['sessionServiceMock'];
    let jwtServiceMock: Awaited<ReturnType<typeof createHiperbancoAuthTestFactory>>['jwtServiceMock'];

    beforeEach(async () => {
        const factory = await createHiperbancoAuthTestFactory();
        service = factory.service;
        httpServiceMock = factory.httpServiceMock;
        credentialsServiceMock = factory.credentialsServiceMock;
        sessionServiceMock = factory.sessionServiceMock;
        jwtServiceMock = factory.jwtServiceMock;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('loginBackoffice', () => {
        it('deve autenticar e retornar token JWT com sessionId', async () => {
            const loginDto = mockBackofficeLoginDto();
            const credential = mockProviderCredential();

            credentialsServiceMock.getPublicCredentials.mockResolvedValue(credential);
            httpServiceMock.post.mockResolvedValue({ access_token: 'hiperbanco-token' });

            const result = await service.loginBackoffice(loginDto);

            expect(credentialsServiceMock.getPublicCredentials).toHaveBeenCalledWith(FinancialProvider.HIPERBANCO);
            expect(httpServiceMock.post).toHaveBeenCalledWith(
                '/Backoffice/Login',
                {
                    email: loginDto.email,
                    password: loginDto.password,
                    client_id: 'env-client-id',
                },
            );
            expect(sessionServiceMock.createSession).toHaveBeenCalledWith(
                expect.objectContaining({
                    providerSlug: FinancialProvider.HIPERBANCO,
                    hiperbancoToken: 'hiperbanco-token',
                    loginType: 'backoffice',
                }),
            );
            expect(jwtServiceMock.generateToken).toHaveBeenCalled();
            expect(result).toEqual({
                access_token: 'mock-jwt-token',
                sessionId: 'mock-session-id',
            });
        });
    });

    describe('loginApiBank', () => {
        it('deve autenticar usuário e retornar token JWT com sessionId', async () => {
            const loginDto = mockBankLoginDto();
            const credential = mockProviderCredential();

            credentialsServiceMock.getPublicCredentials.mockResolvedValue(credential);
            httpServiceMock.post.mockResolvedValue({
                access_token: 'bank-token',
                userData: { id: 'user-id', accounts: [{ id: 'account-id' }] },
            });

            const result = await service.loginApiBank(loginDto);

            expect(httpServiceMock.post).toHaveBeenCalledWith(
                '/Users/login/api-bank',
                {
                    document: loginDto.document,
                    password: loginDto.password,
                    clientId: 'env-client-id',
                },
            );
            expect(sessionServiceMock.createSession).toHaveBeenCalledWith(
                expect.objectContaining({
                    providerSlug: FinancialProvider.HIPERBANCO,
                    hiperbancoToken: 'bank-token',
                    userId: 'user-id',
                    accountId: 'account-id',
                    loginType: 'bank',
                }),
            );
            expect(result).toEqual({
                access_token: 'mock-jwt-token',
                sessionId: 'mock-session-id',
            });
        });
    });
});
