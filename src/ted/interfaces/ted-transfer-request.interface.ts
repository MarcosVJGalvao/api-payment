import { TedRecipientDto } from '../dto/ted-recipient.dto';

/**
 * Interface para os dados da transferência TED que serão enviados ao provider.
 * O sender é obtido da sessão, então precisa ser passado junto com o DTO.
 */
export interface ITedTransferRequest {
  amount: number;
  description?: string;
  idempotencyKey?: string;
  sender: ITedSender;
  recipient: TedRecipientDto;
}

/**
 * Interface para os dados do remetente da transferência TED.
 */
export interface ITedSender {
  document: string;
  name: string;
  branch: string;
  account: string;
}
