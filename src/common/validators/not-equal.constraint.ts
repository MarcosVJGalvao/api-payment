import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

/**
 * Validator que verifica se o valor de uma propriedade é diferente de outra.
 * Uso: @Validate(NotEqualConstraint, ['nomeOutraPropriedade'])
 */
@ValidatorConstraint({ name: 'NotEqual', async: false })
export class NotEqualConstraint implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments): boolean {
    const [relatedPropertyName] = args.constraints as [
      keyof typeof args.object,
    ];
    const relatedValue = args.object[relatedPropertyName];
    return value !== relatedValue;
  }

  defaultMessage(args: ValidationArguments): string {
    const [relatedPropertyName] = args.constraints as [string];
    return `$property must not be equal to ${relatedPropertyName}`;
  }
}
