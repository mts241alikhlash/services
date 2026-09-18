import { RequirePermissions } from '../../../access-control/permission/decorators/require-permissions.decorator.js'
import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'

import { JwtAuthGuard } from '../../../auth/index.js'
import { AuditLogQueryDto } from './dto/request/audit-log-query.dto.js'
import {
  AuditLogResponseDto,
  AuditLogSummaryResponseDto,
} from './dto/response/audit-log-response.dto.js'
import { GetAuditLogSummaryUseCase } from '../../application/use-cases/get-audit-log-summary/get-audit-log-summary.use-case.js'
import { GetAuditLogsUseCase } from '../../application/use-cases/get-audit-logs/get-audit-logs.use-case.js'

@ApiTags('Audit Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('audit-logs')
export class AuditLogController {
  constructor(
    private readonly getAuditLogsUseCase: GetAuditLogsUseCase,
    private readonly getAuditLogSummaryUseCase: GetAuditLogSummaryUseCase,
  ) {}

  @Get('summary')
  @RequirePermissions('audit-logs.read')
  @ApiOperation({ summary: 'Audit volume for the administration dashboard' })
  @ApiResponse({ status: 200, type: AuditLogSummaryResponseDto })
  async summary() {
    return this.getAuditLogSummaryUseCase.execute()
  }

  @Get()
  @RequirePermissions('audit-logs.read')
  @ApiOperation({ summary: 'List all audit logs (paginated, filterable)' })
  @ApiResponse({ status: 200, type: [AuditLogResponseDto] })
  async findAll(@Query() query: AuditLogQueryDto) {
    return this.getAuditLogsUseCase.execute(query)
  }
}
