import { ClientStatus } from '../enums/client-status.enum';

export interface ICreateClient {
  name: string;
  document: string;
  status?: ClientStatus;
}
