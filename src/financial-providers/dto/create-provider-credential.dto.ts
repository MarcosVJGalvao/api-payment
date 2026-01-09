import { IsNotEmpty, IsString, MinLength, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProviderLoginType } from '../enums/provider-login-type.enum';

/**
 * DTO para criação/atualização de credenciais de provedor financeiro.
 * Permite múltiplas credenciais por provedor, diferenciando entre backoffice e bank.
 * - BACKOFFICE: Login usando email e senha
 * - BANK: Login usando documento (CPF/CNPJ) e senha
 */
export class CreateProviderCredentialDto {
    @ApiProperty({
        enum: ProviderLoginType,
        example: ProviderLoginType.BACKOFFICE,
        description: 'Tipo de login: backoffice (email/senha) ou bank (documento/senha)',
    })
    @IsEnum(ProviderLoginType)
    @IsNotEmpty()
    loginType: ProviderLoginType;

    @ApiProperty({
        example: 'email@email.com',
        description: 'Email (para backoffice) ou documento CPF/CNPJ (para bank) para login no provedor financeiro',
    })
    @IsString()
    @IsNotEmpty()
    login: string;

    @ApiProperty({
        example: 'Senhatest123@',
        description: 'Senha para login no provedor',
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string;
}
