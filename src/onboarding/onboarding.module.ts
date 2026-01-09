import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Onboarding } from './entities/onboarding.entity';
import { Account } from '../account/entities/account.entity';
import { OnboardingService } from './onboarding.service';
import { ClientModule } from '../client/client.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Onboarding, Account]),
    ClientModule,
  ],
  providers: [OnboardingService],
  exports: [OnboardingService],
})
export class OnboardingModule {}
