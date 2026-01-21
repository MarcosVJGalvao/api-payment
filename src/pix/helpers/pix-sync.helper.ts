import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PixTransfer } from '../entities/pix-transfer.entity';
import { PixProviderHelper } from './pix-provider.helper';
import { TransactionService } from '@/transaction/transaction.service';
import { ProviderSession } from '@/financial-providers/hiperbanco/interfaces/provider-session.interface';
import { PixTransferStatus } from '../enums/pix-transfer-status.enum';
import { mapPixTransferStatusToTransactionStatus } from '@/common/helpers/status-mapper.helper';

@Injectable()
export class PixSyncHelper {
  private readonly logger = new Logger(PixSyncHelper.name);

  constructor(
    @InjectRepository(PixTransfer)
    private readonly pixTransferRepository: Repository<PixTransfer>,
    private readonly pixProviderHelper: PixProviderHelper,
    private readonly transactionService: TransactionService,
  ) {}

  /**
   * Sincroniza o status de uma transferência Pix com o provedor.
   * Utiliza estratégia "Read-Repair".
   */
  async syncTransferWithProvider(
    pixTransfer: PixTransfer,
    session: ProviderSession,
  ): Promise<PixTransfer> {
    if (!pixTransfer.authenticationCode) {
      return pixTransfer;
    }

    try {
      const senderAccountNumber = pixTransfer.sender?.accountNumber;
      if (!senderAccountNumber) {
        return pixTransfer;
      }

      const response = await this.pixProviderHelper.getTransferStatus(
        pixTransfer.providerSlug,
        senderAccountNumber,
        pixTransfer.authenticationCode,
        session,
      );

      const providerStatus = response.status.toUpperCase();
      let newStatus: PixTransferStatus | undefined;

      if (providerStatus === 'DONE') {
        newStatus = PixTransferStatus.DONE;
      } else if (providerStatus === 'CREATED' || providerStatus === 'WAITING') {
        newStatus = PixTransferStatus.CREATED;
      } else if (providerStatus === 'CANCELED') {
        newStatus = PixTransferStatus.CANCELED;
      } else if (providerStatus === 'UNDONE') {
        newStatus = PixTransferStatus.UNDONE;
      } else if (providerStatus === 'REPROVED') {
        newStatus = PixTransferStatus.REPROVED;
      } else if (
        providerStatus === 'CHECKING' ||
        providerStatus === 'IN_PROCESS'
      ) {
        newStatus = PixTransferStatus.IN_PROCESS;
      }

      if (newStatus && newStatus !== pixTransfer.status) {
        this.logger.log(
          `Updating PixTransfer ${pixTransfer.id} status from ${pixTransfer.status} to ${newStatus}`,
        );
        pixTransfer.status = newStatus;

        await this.pixTransferRepository.save(pixTransfer);

        await this.transactionService.updateStatus(
          pixTransfer.authenticationCode,
          mapPixTransferStatusToTransactionStatus(newStatus),
        );
      }
    } catch (error) {
      this.logger.warn(
        `Failed to sync PixTransfer ${pixTransfer.id} with provider: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return pixTransfer;
  }
}
