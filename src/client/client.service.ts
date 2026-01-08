import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './entities/client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { QueryClientDto } from './dto/query-client.dto';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import { BaseQueryService } from '@/common/base-query/service/base-query.service';
import { PaginationResult } from '@/common/base-query/interfaces/pagination-result.interface';
import { FilterOperator } from '@/common/base-query/enums/filter-operator.enum';

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(Client)
    private readonly repository: Repository<Client>,
    private readonly baseQueryService: BaseQueryService,
  ) {}

  async create(createClientDto: CreateClientDto): Promise<Client> {
    // Verificar se já existe cliente com o mesmo documento
    const existingClient = await this.repository.findOne({
      where: { document: createClientDto.document },
      withDeleted: true,
    });

    if (existingClient) {
      throw new CustomHttpException(
        'Client with this document already exists',
        HttpStatus.CONFLICT,
        ErrorCode.CLIENT_ALREADY_EXISTS,
      );
    }

    const client = this.repository.create({
      ...createClientDto,
      status: createClientDto.status || 'ACTIVE',
    });

    return this.repository.save(client);
  }

  async findAll(queryDto: QueryClientDto): Promise<PaginationResult<Client>> {
    const queryOptions = this.baseQueryService.buildQueryOptions(
      this.repository,
      queryDto,
      {
        defaultSortBy: 'createdAt',
        searchFields: ['name', 'document'],
        dateField: 'createdAt',
        filters: [
          {
            field: 'status',
            operator: FilterOperator.EQUALS,
          },
        ],
      },
    );

    return this.baseQueryService.findAll(this.repository, queryOptions);
  }

  async findById(id: string): Promise<Client> {
    const client = await this.repository.findOne({ where: { id } });

    if (!client) {
      throw new CustomHttpException(
        'Client not found',
        HttpStatus.NOT_FOUND,
        ErrorCode.CLIENT_NOT_FOUND,
      );
    }

    return client;
  }

  async update(id: string, updateClientDto: UpdateClientDto): Promise<Client> {
    const client = await this.findById(id);

    if (updateClientDto.name) {
      client.name = updateClientDto.name;
    }
    if (updateClientDto.status) {
      client.status = updateClientDto.status;
    }

    return this.repository.save(client);
  }

  async remove(id: string): Promise<void> {
    const client = await this.findById(id);
    await this.repository.softRemove(client);
  }
}
