import { BackofficeLoginDto } from '../../dto/backoffice-login.dto';
import { BankLoginDto } from '../../dto/bank-login.dto';

/**
 * Mock de BackofficeLoginDto.
 */
export const mockBackofficeLoginDto = (): BackofficeLoginDto => ({
    email: 'admin@empresa.com',
    password: 'Senha123@',
});

/**
 * Mock de BankLoginDto.
 */
export const mockBankLoginDto = (): BankLoginDto => ({
    document: '52365478526',
    password: 'senha123',
});
