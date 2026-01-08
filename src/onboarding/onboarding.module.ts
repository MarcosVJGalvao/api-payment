import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Onboarding } from './entities/onboarding.entity';
import { OnboardingService } from './onboarding.service';
import { ClientModule } from '../client/client.module';
import { AccountModule } from '../account/account.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Onboarding]),
    ClientModule,
    AccountModule,
  ],
  providers: [OnboardingService],
  exports: [OnboardingService],
})
export class OnboardingModule {}
