import { Length, IsNotEmpty, IsString, Matches } from 'class-validator';

export class ValidateBillPaymentParamsDto {
  @IsString()
  @IsNotEmpty()
  @Length(44, 48, { message: 'Digitable must be between 44 and 48 characters' })
  @Matches(/^\d+$/, { message: 'Digitable must contain only numbers' })
  digitable: string;
}
