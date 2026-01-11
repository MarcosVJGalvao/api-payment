import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

@ValidatorConstraint({ name: 'isPixKey', async: false })
export class IsPixKeyConstraint implements ValidatorConstraintInterface {
  validate(value: any) {
    if (typeof value !== 'string') return false;

    // CPF: 11 digits (no mask)
    const cpfRegex = /^\d{11}$/;
    if (cpfRegex.test(value)) return true;

    // CNPJ: 14 digits (no mask)
    const cnpjRegex = /^\d{14}$/;
    if (cnpjRegex.test(value)) return true;

    // Email: standard email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (emailRegex.test(value)) return true;

    // Phone: +55 followed by DDD (2 digits) and number (8-9 digits)
    const phoneRegex = /^\+55\d{10,11}$/;
    if (phoneRegex.test(value)) return true;

    // EVP: UUID with or without dashes
    const evpRegex =
      /^[0-9a-fA-F]{8}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{12}$/;
    if (evpRegex.test(value)) return true;

    return false;
  }

  defaultMessage() {
    return 'Invalid PIX key format. Supported formats: CPF (11 digits), CNPJ (14 digits), Email, Phone (+55...), or EVP (UUID).';
  }
}

export function IsPixKey(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPixKeyConstraint,
    });
  };
}
