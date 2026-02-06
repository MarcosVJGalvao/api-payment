import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { isRecord } from '@/common/errors/helpers/type.helpers';

/**
 * Validator que verifica se o valor de uma propriedade é diferente de outra.
 * Uso: @Validate(NotEqualConstraint, ['nomeOutraPropriedade'])
 */
@ValidatorConstraint({ name: 'NotEqual', async: false })
export class NotEqualConstraint implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments): boolean {
    const [relatedPropertyName] = Array.isArray(args.constraints)
      ? args.constraints
      : [];
    if (typeof relatedPropertyName !== 'string') {
      return true;
    }
    const obj = isRecord(args.object) ? args.object : {};
    const relatedValue = obj[relatedPropertyName];
    return value !== relatedValue;
  }

  defaultMessage(args: ValidationArguments): string {
    const [relatedPropertyName] = Array.isArray(args.constraints)
      ? args.constraints
      : [];
    return `$property must not be equal to ${String(relatedPropertyName ?? '')}`;
  }
}
