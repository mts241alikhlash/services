import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Public } from '../../../core/decorators/public.decorator.js'
import { ProvisioningTokenGuard } from '../../../user/guards/provisioning-token.guard.js'
import { CreateAuditLogUseCase } from '../../application/use-cases/create-audit-log/create-audit-log.use-case.js'
import { IngestAuditLogDto } from './dto/request/ingest-audit-log.dto.js'
import { AuditLogResponseDto } from './dto/response/audit-log-response.dto.js'

@ApiTags('Audit Logs')
@Public()
@UseGuards(ProvisioningTokenGuard)
@Controller('audit-logs')
export class AuditLogIngestController {
  constructor(private readonly createAuditLogUseCase: CreateAuditLogUseCase) {}

  @Post()
  @ApiOperation({
    summary: 'Record an audit entry on behalf of another service',
  })
  @ApiResponse({ status: 201, type: AuditLogResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid provisioning token',
  })
  async ingest(@Body() dto: IngestAuditLogDto) {
    return this.createAuditLogUseCase.execute(dto)
  }
}
