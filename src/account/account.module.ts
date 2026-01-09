import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './entities/account.entity';
import { AccountService } from './account.service';
import { ClientModule } from '../client/client.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Account]),
    ClientModule,
  ],
  providers: [AccountService],
  exports: [AccountService],
})
export class AccountModule {}
