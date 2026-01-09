import { createHiperbancoAuthTestFactory } from './factory/hiperbanco.service.factory';
import { mockProviderCredential } from './mocks/hiperbanco.mock';
import { mockBackofficeLoginDto, mockBankLoginDto } from './mocks/hiperbanco-dto.mock';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { ProviderLoginType } from '../enums/provider-login-type.enum';
import { Account, AccountStatus, AccountType } from '@/account/entities/account.entity';

describe('HiperbancoAuthService', () => {
    let service: Awaited<ReturnType<typeof createHiperbancoAuthTestFactory>>['service'];
    let httpServiceMock: Awaited<ReturnType<typeof createHiperbancoAuthTestFactory>>['httpServiceMock'];
    let credentialsServiceMock: Awaited<ReturnType<typeof createHiperbancoAuthTestFactory>>['credentialsServiceMock'];
    let sessionServiceMock: Awaited<ReturnType<typeof createHiperbancoAuthTestFactory>>['sessionServiceMock'];
    let jwtServiceMock: Awaited<ReturnType<typeof createHiperbancoAuthTestFactory>>['jwtServiceMock'];
    let accountServiceMock: Awaited<ReturnType<typeof createHiperbancoAuthTestFactory>>['accountServiceMock'];
    let onboardingServiceMock: Awaited<ReturnType<typeof createHiperbancoAuthTestFactory>>['onboardingServiceMock'];

    beforeEach(async () => {
        const factory = await createHiperbancoAuthTestFactory();
        service = factory.service;
        httpServiceMock = factory.httpServiceMock;
        credentialsServiceMock = factory.credentialsServiceMock;
        sessionServiceMock = factory.sessionServiceMock;
        jwtServiceMock = factory.jwtServiceMock;
        accountServiceMock = factory.accountServiceMock;
        onboardingServiceMock = factory.onboardingServiceMock;
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

            expect(credentialsServiceMock.getPublicCredentials).toHaveBeenCalledWith(FinancialProvider.HIPERBANCO, ProviderLoginType.BACKOFFICE);
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
                    loginType: ProviderLoginType.BACKOFFICE,
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
                userData: {
                    id: 'user-id',
                    accounts: [
                        {
                            id: 'account-id',
                            status: 'ACTIVE',
                            branch: '0001',
                            number: '1105329590',
                            type: 'MAIN',
                        },
                    ],
                    documentNumber: '12345678900',
                    registerName: 'João Silva',
                },
            });

            const mockAccount: Account = {
                id: 'account-uuid-id', // ID interno gerado pelo banco
                externalId: 'account-id', // ID externo do provedor
                clientId: 'client-id',
                onboardingId: 'onboarding-uuid-id',
                status: AccountStatus.ACTIVE,
                branch: '0001',
                number: '1105329590',
                type: AccountType.MAIN,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: undefined,
            } as Account;

            const mockOnboarding = {
                id: 'onboarding-uuid-id',
                externalUserId: 'user-id',
                clientId: 'client-id',
                registerName: 'João Silva',
                documentNumber: '12345678900',
                typeAccount: 'PF' as const,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: undefined,
            };

            accountServiceMock.createOrUpdate.mockResolvedValue(mockAccount);
            onboardingServiceMock.createOrUpdate.mockResolvedValue(mockOnboarding as any);

            const result = await service.loginApiBank(loginDto, 'client-id');

            expect(httpServiceMock.post).toHaveBeenCalledWith(
                '/Users/login/api-bank',
                {
                    document: loginDto.document,
                    password: loginDto.password,
                    clientId: 'env-client-id',
                },
            );
            expect(onboardingServiceMock.createOrUpdate).toHaveBeenCalledWith(
                'user-id',
                'client-id',
                expect.objectContaining({
                    registerName: 'João Silva',
                    documentNumber: '12345678900',
                    typeAccount: 'PF',
                }),
            );
            expect(accountServiceMock.createOrUpdate).toHaveBeenCalledWith(
                'account-id', // externalId do provedor
                'client-id',
                expect.objectContaining({
                    status: AccountStatus.ACTIVE,
                    branch: '0001',
                    number: '1105329590',
                    type: AccountType.MAIN,
                    onboardingId: 'onboarding-uuid-id', // ID do onboarding criado
                }),
            );
            expect(sessionServiceMock.createSession).toHaveBeenCalledWith(
                expect.objectContaining({
                    providerSlug: FinancialProvider.HIPERBANCO,
                    hiperbancoToken: 'bank-token',
                    userId: 'user-id',
                    accountId: 'account-uuid-id', // ID interno do banco
                    loginType: ProviderLoginType.BANK,
                }),
            );
            expect(result).toEqual({
                access_token: 'mock-jwt-token',
                sessionId: 'mock-session-id',
                documentNumber: '12345678900',
                registerName: 'João Silva',
                accounts: [
                    {
                        id: 'account-uuid-id', // ID interno do banco, não o externalId
                        status: 'ACTIVE',
                        branch: '0001',
                        number: '1105329590',
                        type: 'MAIN',
                    },
                ],
            });
        });
    });
});
