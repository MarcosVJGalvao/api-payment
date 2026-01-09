import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HiperbancoConfigProvider } from './config/hiperbanco.config.provider';

@Module({
  imports: [ConfigModule],
  providers: [HiperbancoConfigProvider],
  exports: [HiperbancoConfigProvider],
})
export class FinancialConfigModule {}
