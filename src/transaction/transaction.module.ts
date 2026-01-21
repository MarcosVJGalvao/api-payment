import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { TransactionRepository } from './repositories/transaction.repository';
import { TransactionService } from './transaction.service';
import { BaseQueryModule } from '@/common/base-query/base-query.module';
import { TransactionController } from './transaction.controller';
import { FinancialProvidersModule } from '@/financial-providers/financial-providers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction]),
    BaseQueryModule,
    FinancialProvidersModule,
  ],
  controllers: [TransactionController],
  providers: [TransactionRepository, TransactionService],
  exports: [TransactionService, TransactionRepository],
})
export class TransactionModule {}
