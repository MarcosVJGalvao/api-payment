import { ClientStatus } from '../enums/client-status.enum';

export interface IClient {
  id: string;
  name: string;
  document: string;
  status: ClientStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
