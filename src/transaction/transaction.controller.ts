import { Controller, Get, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TransactionService } from './transaction.service';
import { GetTransactionsQueryDto } from './dto/get-transactions-query.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { ApiListTransactions } from './docs/api-list-transactions.decorator';
import { ApiGetTransaction } from './docs/api-get-transaction.decorator';
import { ProviderAuthGuard } from '@/financial-providers/guards/provider-auth.guard';
import type { RequestWithSession } from '@/financial-providers/hiperbanco/interfaces/request-with-session.interface';

@ApiTags('Transactions')
@Controller('financial/transactions')
@UseGuards(ProviderAuthGuard)
@ApiBearerAuth('provider-auth')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get()
  @ApiListTransactions()
  async listTransactions(
    @Query() query: GetTransactionsQueryDto,
    @Req() req: RequestWithSession,
  ) {
    const result = await this.transactionService.findAll(
      req.accountId!,
      req.clientId!,
      query,
    );
    return {
      ...result,
      data: result.data.map((t) => new TransactionResponseDto(t)),
    };
  }

  @Get(':id')
  @ApiGetTransaction()
  async getTransaction(
    @Param('id') id: string,
    @Req() req: RequestWithSession,
  ) {
    const transaction = await this.transactionService.findOne(
      id,
      req.accountId!,
      req.clientId!,
    );
    return new TransactionResponseDto(transaction);
  }
}
