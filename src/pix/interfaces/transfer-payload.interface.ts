export interface TransferPayload {
  [key: string]: unknown;
  sender: {
    account: { type: string; branch: string; number: string };
    documentNumber: string;
    name: string;
  };
  amount: number;
  description?: string;
  initializationType: string;
  endToEndId?: string;
  pixKey?: string;
  conciliationId?: string;
  receiverReconciliationId?: string;
  paymentDate?: string;
  recipient?: {
    documentNumber: string;
    name: string;
    account: { branch: string; number: string; type: string };
    bank: { ispb: string };
  };
  transactionNotes?: string;
}
