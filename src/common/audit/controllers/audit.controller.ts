import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from '../services/audit.service';
import { AuditExportService } from '../services/audit-export.service';
import { AuditDashboardService } from '../services/audit-dashboard.service';
import { QueryAuditLogDto } from '../dto/query-audit-log.dto';
import { AuditExportDto } from '../dto/audit-export.dto';
import { AuditDashboardQueryDto } from '../dto/audit-dashboard.dto';
import { PermissionsGuard } from '@/permissions/guards/permissions.guard';
import { RequirePermissions } from '@/permissions/decorators/require-permissions.decorator';
import { PermissionName } from '@/permissions/enums/permission-name.enum';
import { ApiGetAllAuditLogs } from '../docs/api-get-all-audit-logs.decorator';
import { ApiGetAuditLogById } from '../docs/api-get-audit-log-by-id.decorator';
import { ApiGetDashboard } from '../docs/api-get-dashboard.decorator';
import { ApiExportLogs } from '../docs/api-export-logs.decorator';
import { ExportResponseInterceptor } from '../interceptors/export-response.interceptor';

@Controller('audit')
@ApiTags('Auditoria')
@UseGuards(PermissionsGuard)
@ApiBearerAuth('internal-auth')
export class AuditController {
  constructor(
    private readonly auditService: AuditService,
    private readonly auditExportService: AuditExportService,
    private readonly auditDashboardService: AuditDashboardService,
  ) {}

  @Get('dashboard')
  @RequirePermissions(PermissionName.AUDIT_READ)
  @ApiGetDashboard()
  async getDashboard(@Query() queryDto: AuditDashboardQueryDto) {
    return await this.auditDashboardService.getDashboardStats(queryDto);
  }

  @Get('export')
  @RequirePermissions(PermissionName.AUDIT_EXPORT)
  @ApiExportLogs()
  @UseInterceptors(ExportResponseInterceptor)
  async exportLogs(@Query() queryDto: AuditExportDto) {
    return await this.auditExportService.exportLogs(queryDto);
  }

  @Get()
  @RequirePermissions(PermissionName.AUDIT_READ)
  @ApiGetAllAuditLogs()
  async getLogs(@Query() queryDto: QueryAuditLogDto) {
    return await this.auditService.findAllAuditLogs(queryDto);
  }

  @Get(':id')
  @RequirePermissions(PermissionName.AUDIT_READ)
  @ApiGetAuditLogById()
  async getAuditLogById(@Param('id') id: string) {
    return await this.auditService.getAuditLogById(id);
  }
}
