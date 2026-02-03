import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { AuditService } from '../services/audit.service';
import { IAuditLogData } from '../interfaces/audit-log.interface';

@Processor('audit')
export class AuditProcessor {
  private readonly logger = new Logger(AuditProcessor.name);

  constructor(private readonly auditService: AuditService) {}

  @Process('log')
  async handleAuditLog(job: Job<IAuditLogData>) {
    try {
      const auditLogData = job.data;

      this.logger.debug(
        `Processing audit log job ${job.id}: ${auditLogData.action} for ${auditLogData.entityType}`,
      );

      await this.auditService.log(auditLogData);
    } catch (error) {
      this.logger.error(
        `Failed to process audit log job ${job.id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
