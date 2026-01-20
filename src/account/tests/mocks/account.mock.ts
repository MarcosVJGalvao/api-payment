import {
  Account,
  AccountStatus,
  AccountType,
} from '../../entities/account.entity';
import { CreateOrUpdateAccountData } from '../../account.service';

export const mockAccount = (): Account => {
  const account = new Account();
  account.id = 'uuid-account-1';
  account.externalId = 'ext-12345';
  account.clientId = 'uuid-client-1';
  account.status = AccountStatus.ACTIVE;
  account.branch = '0001';
  account.number = '12345-6';
  account.type = AccountType.MAIN;
  account.onboardingId = 'uuid-onboarding-1';
  account.createdAt = new Date();
  account.updatedAt = new Date();
  account.deletedAt = undefined;
  return account;
};

export const mockCreateOrUpdateAccountData = (): CreateOrUpdateAccountData => ({
  status: AccountStatus.ACTIVE,
  branch: '0001',
  number: '12345-6',
  type: AccountType.MAIN,
  onboardingId: 'uuid-onboarding-1',
});
