import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { TransactionRepository } from './repositories/transaction.repository';
import { TransactionService } from './transaction.service';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction])],
  providers: [TransactionRepository, TransactionService],
  exports: [TransactionService, TransactionRepository],
})
export class TransactionModule {}
