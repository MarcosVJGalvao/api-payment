import { Client } from '../../entities/client.entity';
import { CreateClientDto } from '../../dto/create-client.dto';
import { UpdateClientDto } from '../../dto/update-client.dto';
import { ClientStatus } from '../../enums/client-status.enum';
import { PaginationResult } from '@/common/base-query/interfaces/pagination-result.interface';

export const mockClient = (): Client => {
  const client = new Client();
  client.id = 'uuid-client-1';
  client.name = 'Test Client';
  client.document = '12345678901';
  client.alias = 'test-alias';
  client.status = ClientStatus.ACTIVE;
  client.createdAt = new Date();
  client.updatedAt = new Date();
  client.deletedAt = undefined;
  return client;
};

export const mockCreateClientDto = (): CreateClientDto => ({
  name: 'Test Client',
  document: '12345678901',
  scopes: ['scope:1', 'scope:2'],
});

export const mockUpdateClientDto = (): UpdateClientDto => ({
  name: 'Updated Client',
  status: ClientStatus.INACTIVE,
  scopes: ['scope:3'],
});

export const mockClientPaginationResult = (): PaginationResult<Client> => ({
  data: [mockClient()],
  meta: {
    page: 1,
    limit: 10,
    total: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  },
});
