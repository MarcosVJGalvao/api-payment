import { Injectable, Logger } from '@nestjs/common';
import { AuditExportDto, ExportFormat } from '../dto/audit-export.dto';
import {
  formatToJSON,
  formatToCSV,
} from '../helpers/export/export-formatter.helper';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { ExportResponse } from '../interfaces/export-response.interface';
import { transformToISO, getCurrentDate } from '@/common/helpers/date.helpers';

@Injectable()
export class AuditExportService {
  private readonly logger = new Logger(AuditExportService.name);

  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  async exportLogs(dto: AuditExportDto): Promise<ExportResponse> {
    try {
      const logs = await this.auditLogRepository.findAllForExport(dto);

      const format = dto.format || ExportFormat.JSON;
      const timestamp = transformToISO(getCurrentDate())
        .replace(/:/g, '-')
        .split('.')[0];

      if (format === ExportFormat.CSV) {
        const filename = `audit-logs-${timestamp}.csv`;
        const contentType = 'text/csv; charset=utf-8';
        const data = formatToCSV(logs);

        return {
          data,
          format: ExportFormat.CSV,
          contentType,
          filename,
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${filename}"`,
          },
        };
      }

      const filename = `audit-logs-${timestamp}.json`;
      const contentType = 'application/json; charset=utf-8';
      const data = formatToJSON(logs);

      return {
        data,
        format: ExportFormat.JSON,
        contentType,
        filename,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to export audit logs: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
