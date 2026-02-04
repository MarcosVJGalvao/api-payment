import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { BackofficeUser } from '../entities/backoffice-user.entity';
import { CreateBackofficeUserDto } from '../dto/create-backoffice-user.dto';
import { AppLoggerService } from '@/common/logger/logger.service';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { HttpStatus } from '@nestjs/common';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import { hashData } from '@/common/helpers/password.helper';
import { QueryBackofficeUserDto } from '../dto/query-backoffice-user.dto';
import { PaginationResult } from '@/common/base-query/interfaces/pagination-result.interface';
import { BaseQueryService } from '@/common/base-query/service/base-query.service';
import { FilterOperator } from '@/common/base-query/enums/filter-operator.enum';
import { SortOrder } from '@/common/base-query/enums/sort-order.enum';
import { StatusEnum } from '@/common/enums/status.enum';
import { BackofficeUserSortField } from '../enums/backoffice-user-sort.enum';

@Injectable()
export class BackofficeUserService {
  private readonly context = BackofficeUserService.name;

  constructor(
    @InjectRepository(BackofficeUser)
    private readonly repository: Repository<BackofficeUser>,
    private readonly logger: AppLoggerService,
    private readonly baseQueryService: BaseQueryService,
  ) {}

  async create(
    dto: CreateBackofficeUserDto,
    clientId: string,
  ): Promise<BackofficeUser> {
    this.logger.log(
      `Creating backoffice user for client ${clientId}`,
      this.context,
    );

    // Validate if user already exists
    const existing = await this.repository.findOne({
      where: { email: dto.email, clientId },
    });
    if (existing) {
      throw new CustomHttpException(
        'User with this email already exists',
        HttpStatus.CONFLICT,
        ErrorCode.USER_ALREADY_EXISTS,
      );
    }

    const hashedPassword = await hashData(String(dto.password));
    const hashedSecretAnswer = await hashData(
      String(dto.secretAnswer).toLowerCase(),
    );

    const user = this.repository.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      secretAnswer: hashedSecretAnswer,
      clientId: clientId,
      status: StatusEnum.ACTIVE,
    });

    return this.repository.save(user);
  }

  async findAll(
    query: QueryBackofficeUserDto,
    clientId?: string,
  ): Promise<PaginationResult<BackofficeUser>> {
    const queryOptions = this.baseQueryService.buildQueryOptions(
      this.repository,
      query,
      {
        defaultSortBy: 'createdAt',
        sortableFields: Object.values(BackofficeUserSortField),
        searchFields: ['name', 'email'],
        defaultSortOrder: SortOrder.DESC,
        withDeleted: true,
      },
    );

    if (!queryOptions.filters) {
      queryOptions.filters = [];
    }

    if (clientId) {
      queryOptions.filters.push({
        field: 'clientId',
        operator: FilterOperator.EQUALS,
        value: clientId,
      });
    }

    return this.baseQueryService.findAll(this.repository, queryOptions);
  }

  async findByEmail(email: string): Promise<BackofficeUser | null> {
    return this.repository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<BackofficeUser | null> {
    return this.repository.findOne({ where: { id } });
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    const hashedPassword = await hashData(newPassword);
    await this.repository.update(id, { password: hashedPassword });
    this.logger.log(`Password updated for user ${id}`, this.context);
  }

  async remove(id: string, clientId?: string): Promise<void> {
    const criteria: FindOptionsWhere<BackofficeUser> = { id };
    if (clientId) {
      criteria.clientId = clientId;
    }

    await this.repository.update(criteria, { status: StatusEnum.INACTIVE });

    const result = await this.repository.softDelete(criteria);

    if (result.affected === 0) {
      throw new CustomHttpException(
        'User not found.',
        HttpStatus.NOT_FOUND,
        ErrorCode.USER_NOT_FOUND,
      );
    }

    this.logger.log(`User ${id} soft deleted`, this.context);
  }
}
