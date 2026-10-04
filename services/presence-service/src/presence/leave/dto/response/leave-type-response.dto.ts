import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { LeaveTypeEntity } from '../../domain/entities/leave.entity.js'

export class LeaveTypeResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ enum: ['ON_LEAVE', 'OFFICIAL_DUTY'] })
  treatment!: 'ON_LEAVE' | 'OFFICIAL_DUTY'

  @ApiProperty({ type: Boolean })
  consumesQuota!: boolean

  @ApiPropertyOptional({ type: Number, nullable: true })
  annualQuota?: number | null

  @ApiProperty({ type: Boolean })
  requiresDocument!: boolean

  @ApiProperty({ enum: ['STUDENT', 'EMPLOYEE'] })
  appliesTo!: 'STUDENT' | 'EMPLOYEE'

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  static fromDomain(domain: LeaveTypeEntity): LeaveTypeResponseDto {
    const dto = new LeaveTypeResponseDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    dto.treatment = domain.treatment
    dto.consumesQuota = domain.consumesQuota
    dto.annualQuota = domain.annualQuota
    dto.requiresDocument = domain.requiresDocument
    dto.appliesTo = domain.appliesTo
    dto.isActive = domain.isActive
    return dto
  }
}
