import { PixKeyType } from '@/pix/enums/pix-key-type.enum';

export function resolvePixKeyType(
  value: string,
  warn?: (message: string) => void,
): PixKeyType {
  switch (value) {
    case 'CPF':
      return PixKeyType.CPF;
    case 'CNPJ':
      return PixKeyType.CNPJ;
    case 'EMAIL':
      return PixKeyType.EMAIL;
    case 'PHONE':
      return PixKeyType.PHONE;
    case 'EVP':
      return PixKeyType.EVP;
    default:
      warn?.(`Unknown PIX key type received: ${value}`);
      return PixKeyType.EVP;
  }
}

