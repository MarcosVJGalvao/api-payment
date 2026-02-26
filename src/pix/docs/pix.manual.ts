import { IManualTag } from '@/swagger/interfaces/manual-tag.interface';

export const pixManualTag: IManualTag = {
  name: 'PIX (Manual)',
  apiTag: 'PIX',
  description: [
    '## PIX',
    '',
    'Operações relacionadas a PIX: chaves, QR Codes, transferências e utilitários.',
    '',
    '### Tópicos cobertos',
    '',
    '- Registro e remoção de chaves PIX',
    '- Geração e leitura de QR Code (estático/dinâmico)',
    '- Transferências PIX',
    '- Geração de TOTP (quando aplicável)',
    '',
    '### Observação',
    '',
    'Alguns fluxos podem exigir TOTP e retornar `PIX_TOTP_REQUIRED`.',
  ].join('\n'),
};
