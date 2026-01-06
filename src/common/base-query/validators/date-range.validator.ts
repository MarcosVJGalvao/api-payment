import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { parseDate } from '@/common/helpers/date.helpers';

@ValidatorConstraint({ name: 'validateDateRange', async: false })
export class ValidateDateRangeConstraint implements ValidatorConstraintInterface {
  /**
   * Valida se endDate é maior ou igual a startDate
   * @param value - Valor do campo sendo validado
   * @param args - Argumentos de validação
   * @returns true se endDate >= startDate, false caso contrário
   */
  validate(value: unknown, args: ValidationArguments): boolean {
    const obj = args.object as Record<string, unknown>;
    const startDate = obj.startDate;
    const endDate = obj.endDate;

    if (!startDate || !endDate) {
      return true;
    }

    if (typeof startDate !== 'string' || typeof endDate !== 'string') {
      return false;
    }

    const start = parseDate(startDate);
    const end = parseDate(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return false;
    }

    if (end < start) {
      return false;
    }

    return true;
  }

  defaultMessage(): string {
    return 'endDate must be greater than or equal to startDate';
  }
}
