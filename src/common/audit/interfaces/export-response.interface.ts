import { ExportFormat } from '../dto/audit-export.dto';

export interface ExportResponse {
  data: string;
  format: ExportFormat;
  contentType: string;
  filename: string;
  headers: {
    'Content-Type': string;
    'Content-Disposition': string;
  };
}
