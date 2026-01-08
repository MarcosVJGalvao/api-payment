import { ClientStatus } from '../enums/client-status.enum';

export interface IUpdateClient {
  name?: string;
  status?: ClientStatus;
}
