import { DiscountType } from '../enums/discount-type.enum';

export interface IDiscount {
  limitDate: string;
  value: number;
  type: DiscountType;
}
