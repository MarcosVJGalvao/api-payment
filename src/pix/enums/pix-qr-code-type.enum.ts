/**
 * Tipo de QR Code PIX.
 */
export enum PixQrCodeType {
  /** QR Code estático - pode ser utilizado múltiplas vezes */
  STATIC = 'STATIC',
  /** QR Code dinâmico - pode ter validade e configuração de pagamento único */
  DYNAMIC = 'DYNAMIC',
}
