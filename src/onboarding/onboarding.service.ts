import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Onboarding } from './entities/onboarding.entity';
import { OnboardingTypeAccount } from './enums/onboarding-type-account.enum';

export interface CreateOrUpdateOnboardingData {
  registerName: string;
  documentNumber: string;
  typeAccount: OnboardingTypeAccount;
}

@Injectable()
export class OnboardingService {
  constructor(
    @InjectRepository(Onboarding)
    private readonly repository: Repository<Onboarding>,
  ) {}

  async createOrUpdate(
    externalUserId: string,
    clientId: string,
    data: CreateOrUpdateOnboardingData,
  ): Promise<Onboarding> {
    let onboarding = await this.repository.findOne({
      where: { externalUserId, clientId },
    });

    if (onboarding) {
      onboarding.registerName = data.registerName;
      onboarding.documentNumber = data.documentNumber;
      onboarding.typeAccount = data.typeAccount;
    } else {
      onboarding = this.repository.create({
        externalUserId,
        clientId,
        ...data,
      });
    }

    return this.repository.save(onboarding);
  }
}
