import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para criação/atualização de credenciais de provedor financeiro.
 */
export class CreateProviderCredentialDto {
    @ApiProperty({
        example: 'email@email.com',
        description: 'Usuário ou email para login no provedor financeiro',
    })
    @IsEmail()
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
