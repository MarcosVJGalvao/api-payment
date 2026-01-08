import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { BoletoStatus } from '../enums/boleto-status.enum';
import { IUpdateBoleto } from '../interfaces/update-boleto.interface';

export class UpdateBoletoDto implements IUpdateBoleto {
    @ApiPropertyOptional({ enum: BoletoStatus, description: 'Status do boleto' })
    @IsOptional()
    @IsEnum(BoletoStatus)
    status?: BoletoStatus;

    @ApiPropertyOptional({ description: 'Código de autenticação recebido via webhook', example: 'a9f174c0-2a95-473c-935a-cc26fded2720' })
    @IsOptional()
    @IsString()
    authenticationCode?: string;

    @ApiPropertyOptional({ description: 'Código de barras recebido via webhook', example: '65597940700000001000001115801398869900725986' })
    @IsOptional()
    @IsString()
    barcode?: string;

    @ApiPropertyOptional({ description: 'Linha digitável recebida via webhook', example: '65590001151446968518579001874704188970000002000' })
    @IsOptional()
    @IsString()
    digitable?: string;
}
