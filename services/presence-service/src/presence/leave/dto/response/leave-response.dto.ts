import type { LeaveBalanceRow } from '../../domain/entities/leave.entity.js'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { LeaveRequestWithDetails } from '../../domain/entities/leave.entity.js'

export class LeaveRequestResponseRequesterDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String, nullable: true })
  displayName!: string | null

  static fromDomain(
    domain: NonNullable<LeaveRequestWithDetails['requester']>,
  ): LeaveRequestResponseRequesterDto {
    const dto = new LeaveRequestResponseRequesterDto()
    dto.id = domain.id
    dto.displayName = domain.displayName
    return dto
  }
}

export class LeaveRequestResponseApproverDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String, nullable: true })
  displayName!: string | null

  static fromDomain(
    domain: NonNullable<LeaveRequestWithDetails['approver']>,
  ): LeaveRequestResponseApproverDto {
    const dto = new LeaveRequestResponseApproverDto()
    dto.id = domain.id
    dto.displayName = domain.displayName
    return dto
  }
}

export class LeaveRequestResponseLeaveTypeDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ enum: ['ON_LEAVE', 'OFFICIAL_DUTY'] })
  treatment!: 'ON_LEAVE' | 'OFFICIAL_DUTY'

  static fromDomain(
    domain: NonNullable<LeaveRequestWithDetails['leaveType']>,
  ): LeaveRequestResponseLeaveTypeDto {
    const dto = new LeaveRequestResponseLeaveTypeDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    dto.treatment = domain.treatment
    return dto
  }
}

export class LeaveRequestResponseDto {
  @ApiProperty({ type: () => LeaveRequestResponseRequesterDto })
  requester!: LeaveRequestResponseRequesterDto

  @ApiPropertyOptional({
    type: () => LeaveRequestResponseApproverDto,
    nullable: true,
  })
  approver?: LeaveRequestResponseApproverDto | null

  @ApiProperty({ type: () => LeaveRequestResponseLeaveTypeDto })
  leaveType!: LeaveRequestResponseLeaveTypeDto

  @ApiProperty({ type: String, format: 'date-time', isArray: true })
  days!: string[]

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  requesterId!: string

  @ApiProperty({ type: String })
  leaveTypeId!: string

  @ApiProperty({ type: String, format: 'date-time' })
  startDate!: string

  @ApiProperty({ type: String, format: 'date-time' })
  endDate!: string

  @ApiProperty({ type: String })
  reason!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  documentFileId?: string | null

  @ApiProperty({ enum: ['PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN'] })
  status!: 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN'

  @ApiPropertyOptional({ type: String, nullable: true })
  approverId?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  decidedAt?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  decisionReason?: string | null

  @ApiProperty({ type: Number })
  workingDayCount!: number

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  updatedAt?: string

  static fromDomain(domain: LeaveRequestWithDetails): LeaveRequestResponseDto {
    const dto = new LeaveRequestResponseDto()
    dto.requester = LeaveRequestResponseRequesterDto.fromDomain(
      domain.requester,
    )
    if (domain.approver !== undefined)
      dto.approver =
        domain.approver == null
          ? domain.approver
          : LeaveRequestResponseApproverDto.fromDomain(domain.approver)
    dto.leaveType = LeaveRequestResponseLeaveTypeDto.fromDomain(
      domain.leaveType,
    )
    dto.days = domain.days.map((x) => x.toISOString())
    dto.id = domain.id
    dto.requesterId = domain.requesterId
    dto.leaveTypeId = domain.leaveTypeId
    dto.startDate = domain.startDate.toISOString()
    dto.endDate = domain.endDate.toISOString()
    dto.reason = domain.reason
    dto.documentFileId = domain.documentFileId
    dto.status = domain.status
    dto.approverId = domain.approverId
    if (domain.decidedAt !== undefined)
      dto.decidedAt =
        domain.decidedAt == null
          ? domain.decidedAt
          : domain.decidedAt.toISOString()
    dto.decisionReason = domain.decisionReason
    dto.workingDayCount = domain.workingDayCount
    dto.createdAt = domain.createdAt.toISOString()
    if (domain.updatedAt !== undefined)
      dto.updatedAt =
        domain.updatedAt == null
          ? domain.updatedAt
          : domain.updatedAt.toISOString()
    return dto
  }
}

export class LeaveBalanceResponseDto {
  @ApiProperty({ type: String })
  leaveTypeId!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Number })
  year!: number

  @ApiProperty({ type: Number })
  quota!: number

  @ApiProperty({ type: Number })
  used!: number

  @ApiProperty({ type: Number })
  remaining!: number

  static fromDomain(domain: LeaveBalanceRow): LeaveBalanceResponseDto {
    const dto = new LeaveBalanceResponseDto()
    dto.leaveTypeId = domain.leaveTypeId
    dto.code = domain.code
    dto.name = domain.name
    dto.year = domain.year
    dto.quota = domain.quota
    dto.used = domain.used
    dto.remaining = domain.remaining
    return dto
  }
}
