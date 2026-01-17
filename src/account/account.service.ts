import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account, AccountStatus, AccountType } from './entities/account.entity';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';

export interface CreateOrUpdateAccountData {
  status: AccountStatus;
  branch: string;
  number: string;
  type: AccountType;
  onboardingId?: string;
}

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(Account)
    private readonly repository: Repository<Account>,
  ) {}

  async createOrUpdate(
    externalId: string,
    clientId: string,
    data: CreateOrUpdateAccountData,
  ): Promise<Account> {
    let account = await this.repository.findOne({
      where: { externalId, clientId },
    });

    if (account) {
      account.status = data.status;
      account.branch = data.branch;
      account.number = data.number;
      account.type = data.type;
      if (data.onboardingId !== undefined) {
        account.onboardingId = data.onboardingId;
      }
    } else {
      account = this.repository.create({
        externalId,
        clientId,
        ...data,
      });
    }

    return this.repository.save(account);
  }

  async findById(id: string): Promise<Account | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['onboarding'],
    });
  }

  async findByNumber(number: string): Promise<Account | null> {
    return this.repository.findOne({
      where: { number },
      relations: ['onboarding'],
    });
  }

  async findByOnboardingDocument(document: string): Promise<Account | null> {
    return this.repository.findOne({
      relations: ['onboarding'],
      where: {
        onboarding: {
          documentNumber: document,
        },
      },
    });
  }

  async validateAccountBelongsToClient(
    accountId: string,
    clientId: string,
  ): Promise<void> {
    const account = await this.repository.findOne({
      where: { id: accountId, clientId },
    });

    if (!account) {
      throw new CustomHttpException(
        'Account does not belong to this client',
        HttpStatus.FORBIDDEN,
        ErrorCode.ACCOUNT_DOES_NOT_BELONG_TO_CLIENT,
      );
    }
  }
}
