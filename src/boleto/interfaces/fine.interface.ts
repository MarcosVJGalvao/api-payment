import { FineType } from '../enums/fine-type.enum';

export interface IFine {
    startDate: string;
    value: number;
    type: FineType;
}
