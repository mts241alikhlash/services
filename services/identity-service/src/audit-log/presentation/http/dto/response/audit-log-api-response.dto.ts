import type { AuditLogEntity } from '../../../../domain/entities/audit-log.entity.js'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { AuditLogSummary } from '../../../../domain/repositories/audit-log.repository.js'

export class AuditLogStatsResponseDto {
  @ApiProperty({ type: Number })
  total!: number

  @ApiProperty({ type: Number })
  since!: number

  static fromDomain(domain: AuditLogSummary): AuditLogStatsResponseDto {
    const dto = new AuditLogStatsResponseDto()
    dto.total = domain.total
    dto.since = domain.since
    return dto
  }
}

export class AuditLogEntryResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  userId?: string | null

  @ApiProperty({ type: String })
  action!: string

  @ApiProperty({ type: String })
  resource!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  resourceId?: string | null

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    nullable: true,
    description: 'Free-form JSON',
  })
  metadata?: unknown

  @ApiPropertyOptional({ type: String, nullable: true })
  ipAddress?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  userAgent?: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  static fromDomain(domain: AuditLogEntity): AuditLogEntryResponseDto {
    const dto = new AuditLogEntryResponseDto()
    dto.id = domain.id
    dto.userId = domain.userId
    dto.action = domain.action
    dto.resource = domain.resource
    dto.resourceId = domain.resourceId
    dto.metadata = domain.metadata
    dto.ipAddress = domain.ipAddress
    dto.userAgent = domain.userAgent
    dto.createdAt = domain.createdAt.toISOString()
    return dto
  }
}

export class AuditLogPageResponseDto {
  @ApiProperty({ type: () => [AuditLogEntryResponseDto] })
  data!: AuditLogEntryResponseDto[]

  @ApiProperty({ type: Number })
  total!: number

  @ApiProperty({ type: Number })
  page!: number

  @ApiProperty({ type: Number })
  limit!: number

  static fromDomain(domain: {
    data: AuditLogEntity[]
    total: number
    page: number
    limit: number
  }): AuditLogPageResponseDto {
    const dto = new AuditLogPageResponseDto()
    dto.data = domain.data.map((item) =>
      AuditLogEntryResponseDto.fromDomain(item),
    )
    dto.total = domain.total
    dto.page = domain.page
    dto.limit = domain.limit
    return dto
  }
}
