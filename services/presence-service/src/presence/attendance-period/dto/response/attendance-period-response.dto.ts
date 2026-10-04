import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { AttendancePeriodEntity } from '../../domain/entities/attendance-period.entity.js'

export class AttendancePeriodResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: Number })
  year!: number

  @ApiProperty({ type: Number })
  month!: number

  @ApiProperty({ enum: ['OPEN', 'CLOSED'] })
  status!: 'OPEN' | 'CLOSED'

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  closedAt?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  closedBy?: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string

  static fromDomain(
    domain: AttendancePeriodEntity,
  ): AttendancePeriodResponseDto {
    const dto = new AttendancePeriodResponseDto()
    dto.id = domain.id
    dto.year = domain.year
    dto.month = domain.month
    dto.status = domain.status
    if (domain.closedAt !== undefined)
      dto.closedAt =
        domain.closedAt == null
          ? domain.closedAt
          : domain.closedAt.toISOString()
    dto.closedBy = domain.closedBy
    dto.createdAt = domain.createdAt.toISOString()
    dto.updatedAt = domain.updatedAt.toISOString()
    return dto
  }
}
