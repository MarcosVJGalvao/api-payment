import { differenceInDays, isAfter, isBefore, isSameDay } from 'date-fns';
import { getCurrentDate, parseDateOnly } from '@/common/helpers/date.helpers';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import { HttpStatus } from '@nestjs/common';
import { InterestFineType } from '../enums/interest-fine-type.enum';
import { CreateBoletoDto } from '../dto/create-boleto.dto';
import { BoletoStatus } from '../enums/boleto-status.enum';

/**
 * Valida se a data de vencimento é futura
 * @param dueDate - Data de vencimento em formato string (yyyy-MM-dd)
 * @throws CustomHttpException se a data não for futura
 */
export function validateDueDate(dueDate: string): void {
  const currentDate = getCurrentDate();
  const due = parseDateOnly(dueDate);

  if (isBefore(due, currentDate) || isSameDay(due, currentDate)) {
    throw new CustomHttpException(
      'Due date (dueDate) must be in the future (greater than current date)',
      HttpStatus.BAD_REQUEST,
      ErrorCode.INVALID_BOLETO_DATES,
    );
  }
}

/**
 * Valida a regra de closePayment em relação ao dueDate
 * @param dueDate - Data de vencimento em formato string (yyyy-MM-dd)
 * @param closePayment - Data limite de pagamento em formato string (yyyy-MM-dd)
 * @throws CustomHttpException se a validação falhar
 */
export function validateClosePayment(
  dueDate: string,
  closePayment: string,
): void {
  const due = parseDateOnly(dueDate);
  const close = parseDateOnly(closePayment);
  const daysDifference = differenceInDays(close, due);

  if (daysDifference < 1) {
    throw new CustomHttpException(
      'Close payment date (closePayment) must be at least 1 day after due date (dueDate)',
      HttpStatus.BAD_REQUEST,
      ErrorCode.INVALID_BOLETO_DATES,
    );
  }
}

/**
 * Valida regras de datas para juros e multa
 * @param dueDate - Data de vencimento em formato string (yyyy-MM-dd)
 * @param startDate - Data de início em formato string (yyyy-MM-dd)
 * @param closePayment - Data limite de pagamento em formato string (yyyy-MM-dd)
 * @param type - Tipo (InterestFineType.INTEREST ou InterestFineType.FINE)
 * @throws CustomHttpException se a validação falhar
 */
export function validateInterestFineDates(
  dueDate: string,
  startDate: string,
  closePayment: string,
  type: InterestFineType,
): void {
  const due = parseDateOnly(dueDate);
  const start = parseDateOnly(startDate);
  const close = parseDateOnly(closePayment);

  // Não pode ser inferior ou na mesma data do dueDate
  if (isBefore(start, due) || isSameDay(start, due)) {
    throw new CustomHttpException(
      `${type === InterestFineType.INTEREST ? 'Interest' : 'Fine'} start date must be after due date (dueDate)`,
      HttpStatus.BAD_REQUEST,
      ErrorCode.INVALID_BOLETO_DATES,
    );
  }

  // Não pode ser o mesmo dia ou data superior ao closePayment
  if (isSameDay(start, close) || isAfter(start, close)) {
    throw new CustomHttpException(
      `${type === InterestFineType.INTEREST ? 'Interest' : 'Fine'} start date must be before close payment date (closePayment)`,
      HttpStatus.BAD_REQUEST,
      ErrorCode.INVALID_BOLETO_DATES,
    );
  }

  // closePayment deve ser pelo menos 1 dia à frente do startDate
  const daysDifference = differenceInDays(close, start);
  if (daysDifference < 1) {
    throw new CustomHttpException(
      `Close payment date (closePayment) must be at least 1 day after ${type === InterestFineType.INTEREST ? 'interest' : 'fine'} start date`,
      HttpStatus.BAD_REQUEST,
      ErrorCode.INVALID_BOLETO_DATES,
    );
  }
}

/**
 * Valida regra de data de desconto
 * @param dueDate - Data de vencimento em formato string (yyyy-MM-dd)
 * @param limitDate - Data limite de desconto em formato string (yyyy-MM-dd)
 * @param closePayment - Data limite de pagamento em formato string (yyyy-MM-dd) - opcional
 * @throws CustomHttpException se a validação falhar
 */
export function validateDiscountDate(
  dueDate: string,
  limitDate: string,
  closePayment?: string,
): void {
  const due = parseDateOnly(dueDate);
  const limit = parseDateOnly(limitDate);

  // Não pode ser superior ao dueDate
  if (isAfter(limit, due) || isSameDay(limit, due)) {
    throw new CustomHttpException(
      'Discount limit date (discount.limitDate) must be before due date (dueDate)',
      HttpStatus.BAD_REQUEST,
      ErrorCode.INVALID_BOLETO_DATES,
    );
  }

  // Deve ser até 1 dia antes do dueDate
  const daysDifference = differenceInDays(due, limit);
  if (daysDifference < 1) {
    throw new CustomHttpException(
      'Discount limit date (discount.limitDate) must be at least 1 day before due date (dueDate)',
      HttpStatus.BAD_REQUEST,
      ErrorCode.INVALID_BOLETO_DATES,
    );
  }

  // Não pode ser superior ao closePayment (se existir)
  if (closePayment) {
    const close = parseDateOnly(closePayment);
    if (isAfter(limit, close)) {
      throw new CustomHttpException(
        'Discount limit date (discount.limitDate) cannot be greater than close payment date (closePayment)',
        HttpStatus.BAD_REQUEST,
        ErrorCode.INVALID_BOLETO_DATES,
      );
    }
  }
}

/**
 * Valida todas as regras de negócio relacionadas a datas do boleto.
 * @param dto - Dados do boleto a ser validado
 * @throws CustomHttpException se alguma regra de negócio for violada
 */
export function validateBoletoDates(dto: CreateBoletoDto): void {
  // Regra 1: dueDate não pode ser menor ou igual à data atual
  validateDueDate(dto.dueDate);

  // Regra 2: closePayment não pode ser inferior ao dueDate, deve ser pelo menos 1 dia depois
  if (dto.closePayment) {
    validateClosePayment(dto.dueDate, dto.closePayment);

    // Regra 3: startDate de fine e interest
    if (dto.interest) {
      validateInterestFineDates(
        dto.dueDate,
        dto.interest.startDate,
        dto.closePayment,
        InterestFineType.INTEREST,
      );
    }

    if (dto.fine) {
      validateInterestFineDates(
        dto.dueDate,
        dto.fine.startDate,
        dto.closePayment,
        InterestFineType.FINE,
      );
    }

    // Regra 4: limitDate de discount
    if (dto.discount) {
      validateDiscountDate(
        dto.dueDate,
        dto.discount.limitDate,
        dto.closePayment,
      );
    }
  } else {
    // Se não tem closePayment, ainda precisa validar discount se existir
    if (dto.discount) {
      validateDiscountDate(dto.dueDate, dto.discount.limitDate);
    }
  }
}

/**
 * Converte um status string para BoletoStatus enum de forma segura.
 * Se o status não for válido ou for undefined, retorna BoletoStatus.PROCESSING como padrão.
 * @param status - Status recebido da API externa (pode ser string ou undefined)
 * @returns BoletoStatus válido
 */
export function parseBoletoStatus(status?: string): BoletoStatus {
  if (!status) {
    return BoletoStatus.PROCESSING;
  }

  const validStatuses: readonly string[] = Object.values(BoletoStatus);
  const isValidStatus = (value: string): value is BoletoStatus => {
    return validStatuses.includes(value);
  };

  if (isValidStatus(status)) {
    return status;
  }

  return BoletoStatus.PROCESSING;
}
