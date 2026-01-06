import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'requireBothDates', async: false })
export class RequireBothDatesConstraint implements ValidatorConstraintInterface {
  /**
   * Valida se startDate e endDate foram informados juntos
   * @param value - Valor do campo sendo validado
   * @param args - Argumentos de validação
   * @returns true se ambos ou nenhum foram informados, false caso contrário
   */
  validate(value: unknown, args: ValidationArguments): boolean {
    const obj = args.object as Record<string, unknown>;
    const hasStartDate = !!obj.startDate;
    const hasEndDate = !!obj.endDate;

    if (!hasStartDate && !hasEndDate) {
      return true;
    }

    if (hasStartDate && hasEndDate) {
      return true;
    }

    return false;
  }

  defaultMessage(): string {
    return 'startDate and endDate must be provided together (both or neither)';
  }
}
