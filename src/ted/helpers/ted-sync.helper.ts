import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TedTransfer } from '../entities/ted-transfer.entity';
import { TedProviderHelper } from './ted-provider.helper';
import { TransactionService } from '@/transaction/transaction.service';
import { ProviderSession } from '@/financial-providers/hiperbanco/interfaces/provider-session.interface';
import { TedTransferStatus } from '../enums/ted-transfer-status.enum';
import { mapTedTransferStatusToTransactionStatus } from '@/common/helpers/status-mapper.helper';

@Injectable()
export class TedSyncHelper {
  private readonly logger = new Logger(TedSyncHelper.name);

  constructor(
    @InjectRepository(TedTransfer)
    private readonly tedTransferRepository: Repository<TedTransfer>,
    private readonly tedProviderHelper: TedProviderHelper,
    private readonly transactionService: TransactionService,
  ) {}

  /**
   * Sincroniza o status de uma transferência TED com o provedor.
   * Utiliza estratégia "Read-Repair": consulta o status no provedor e atualiza o banco local se necessário.
   */
  async syncTransferWithProvider(
    tedTransfer: TedTransfer,
    session: ProviderSession,
  ): Promise<TedTransfer> {
    if (!tedTransfer.authenticationCode) {
      return tedTransfer;
    }

    try {
      const response = await this.tedProviderHelper.getTransferStatus(
        tedTransfer.providerSlug,
        tedTransfer.authenticationCode,
        tedTransfer.sender.accountBranch!,
        tedTransfer.sender.accountNumber!,
        session,
      );

      const providerStatus = response.status.toUpperCase();
      let newStatus: TedTransferStatus | undefined;

      if (providerStatus === 'DONE' || providerStatus === 'APPROVED') {
        newStatus = TedTransferStatus.DONE;
      } else if (providerStatus === 'CREATED' || providerStatus === 'WAITING') {
        newStatus = TedTransferStatus.CREATED;
      } else if (providerStatus === 'FAILED' || providerStatus === 'ERROR') {
        newStatus = TedTransferStatus.FAILED;
      } else if (
        providerStatus === 'CANCELED' ||
        providerStatus === 'REFUSED'
      ) {
        newStatus = TedTransferStatus.CANCELED;
      }

      if (newStatus && newStatus !== tedTransfer.status) {
        this.logger.log(
          `Updating TED ${tedTransfer.id} status from ${tedTransfer.status} to ${newStatus}`,
        );
        tedTransfer.status = newStatus;

        await this.tedTransferRepository.save(tedTransfer);

        await this.transactionService.updateStatus(
          tedTransfer.authenticationCode,
          mapTedTransferStatusToTransactionStatus(newStatus),
        );
      }
    } catch (error) {
      this.logger.warn(
        `Failed to sync TED ${tedTransfer.id} with provider: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return tedTransfer;
  }
}
