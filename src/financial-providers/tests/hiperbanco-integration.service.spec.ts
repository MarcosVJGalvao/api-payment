import { createHiperbancoAuthTestFactory } from './factory/hiperbanco.service.factory';
import { mockDecryptedCredential, mockBackofficeLoginResponse, mockBankLoginResponse } from './mocks/hiperbanco.mock';

describe('HiperbancoAuthService', () => {
    let service: Awaited<ReturnType<typeof createHiperbancoAuthTestFactory>>['service'];
    let httpServiceMock: Awaited<ReturnType<typeof createHiperbancoAuthTestFactory>>['httpServiceMock'];
    let credentialsServiceMock: Awaited<ReturnType<typeof createHiperbancoAuthTestFactory>>['credentialsServiceMock'];

    beforeEach(async () => {
        const factory = await createHiperbancoAuthTestFactory();
        service = factory.service;
        httpServiceMock = factory.httpServiceMock;
        credentialsServiceMock = factory.credentialsServiceMock;
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('loginBackoffice', () => {
        it('deve autenticar com credenciais descriptografadas do banco', async () => {
            credentialsServiceMock.getDecryptedCredentials.mockResolvedValue(mockDecryptedCredential());
            httpServiceMock.post.mockResolvedValue(mockBackofficeLoginResponse());

            const result = await service.loginBackoffice();

            expect(credentialsServiceMock.getDecryptedCredentials).toHaveBeenCalledWith('hiperbanco');
            expect(httpServiceMock.post).toHaveBeenCalledWith(
                '/Backoffice/Login',
                {
                    email: 'user@test.com',
                    password: 'decrypted-password',
                    client_id: 'env-client-id',
                },
            );
            expect(result).toEqual(mockBackofficeLoginResponse());
        });
    });

    describe('loginApiBank', () => {
        it('deve autenticar usuário com documento e senha da requisição', async () => {
            httpServiceMock.post.mockResolvedValue(mockBankLoginResponse());

            const result = await service.loginApiBank('52365478526', 'senha123');

            expect(httpServiceMock.post).toHaveBeenCalledWith(
                '/Users/login/api-bank',
                {
                    document: '52365478526',
                    password: 'senha123',
                    clientId: 'env-client-id',
                },
            );
            expect(result).toEqual(mockBankLoginResponse());
        });
    });
});
