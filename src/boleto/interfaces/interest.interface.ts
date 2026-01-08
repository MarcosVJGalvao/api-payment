import { InterestType } from '../enums/interest-type.enum';

export interface IInterest {
    startDate: string;
    value: number;
    type: InterestType;
}
