export interface IConfirmBillPayment {
  id: string;
  bankBranch: string;
  bankAccount: string;
  amount: number;
  description?: string;
}
