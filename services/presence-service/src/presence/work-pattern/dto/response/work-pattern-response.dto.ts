import type { BulkUpsertNonWorkingDaysUseCase } from '../../use-cases/manage-non-working-days.use-case.js'
import type { NonWorkingDayEntity } from '../../domain/entities/work-pattern.entity.js'
import type { WorkPatternAssignmentWithDetails } from '../../domain/entities/work-pattern.entity.js'
import type { WorkPatternDayEntity } from '../../domain/entities/work-pattern.entity.js'
import type { WorkPatternEntity } from '../../domain/entities/work-pattern.entity.js'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { WorkPatternWithDays } from '../../domain/entities/work-pattern.entity.js'

export class WorkPatternWithDaysResponseDaysDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  workPatternId!: string

  @ApiProperty({ type: Number })
  weekday!: number

  @ApiProperty({ type: Boolean })
  isWorkingDay!: boolean

  @ApiProperty({ type: String })
  startTime!: string

  @ApiProperty({ type: String })
  endTime!: string

  static fromDomain(
    domain: NonNullable<NonNullable<WorkPatternWithDays['days']>[number]>,
  ): WorkPatternWithDaysResponseDaysDto {
    const dto = new WorkPatternWithDaysResponseDaysDto()
    dto.id = domain.id
    dto.workPatternId = domain.workPatternId
    dto.weekday = domain.weekday
    dto.isWorkingDay = domain.isWorkingDay
    dto.startTime = domain.startTime
    dto.endTime = domain.endTime
    return dto
  }
}

export class WorkPatternWithDaysResponseDto {
  @ApiProperty({
    type: () => WorkPatternWithDaysResponseDaysDto,
    isArray: true,
  })
  days!: WorkPatternWithDaysResponseDaysDto[]

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  isDefault!: boolean

  @ApiProperty({ type: Number })
  graceMinutes!: number

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string

  static fromDomain(
    domain: WorkPatternWithDays,
  ): WorkPatternWithDaysResponseDto {
    const dto = new WorkPatternWithDaysResponseDto()
    dto.days = domain.days.map((x) =>
      WorkPatternWithDaysResponseDaysDto.fromDomain(x),
    )
    dto.id = domain.id
    dto.name = domain.name
    dto.isDefault = domain.isDefault
    dto.graceMinutes = domain.graceMinutes
    dto.createdAt = domain.createdAt.toISOString()
    dto.updatedAt = domain.updatedAt.toISOString()
    return dto
  }
}

export class WorkPatternResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  isDefault!: boolean

  @ApiProperty({ type: Number })
  graceMinutes!: number

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string

  static fromDomain(domain: WorkPatternEntity): WorkPatternResponseDto {
    const dto = new WorkPatternResponseDto()
    dto.id = domain.id
    dto.name = domain.name
    dto.isDefault = domain.isDefault
    dto.graceMinutes = domain.graceMinutes
    dto.createdAt = domain.createdAt.toISOString()
    dto.updatedAt = domain.updatedAt.toISOString()
    return dto
  }
}

export class WorkPatternDayResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  workPatternId!: string

  @ApiProperty({ type: Number })
  weekday!: number

  @ApiProperty({ type: Boolean })
  isWorkingDay!: boolean

  @ApiProperty({ type: String })
  startTime!: string

  @ApiProperty({ type: String })
  endTime!: string

  static fromDomain(domain: WorkPatternDayEntity): WorkPatternDayResponseDto {
    const dto = new WorkPatternDayResponseDto()
    dto.id = domain.id
    dto.workPatternId = domain.workPatternId
    dto.weekday = domain.weekday
    dto.isWorkingDay = domain.isWorkingDay
    dto.startTime = domain.startTime
    dto.endTime = domain.endTime
    return dto
  }
}

export class WorkPatternAssignmentResponseHolderDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiProperty({ type: String, nullable: true })
  displayName!: string | null

  static fromDomain(
    domain: NonNullable<WorkPatternAssignmentWithDetails['holder']>,
  ): WorkPatternAssignmentResponseHolderDto {
    const dto = new WorkPatternAssignmentResponseHolderDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    dto.displayName = domain.displayName
    return dto
  }
}

export class WorkPatternAssignmentResponseDto {
  @ApiProperty({ type: () => WorkPatternAssignmentResponseHolderDto })
  holder!: WorkPatternAssignmentResponseHolderDto

  @ApiProperty({ type: String })
  patternName!: string

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  userId!: string

  @ApiProperty({ type: String })
  workPatternId!: string

  @ApiProperty({ type: String, format: 'date-time' })
  effectiveFrom!: string

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  effectiveTo?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  createdAt?: string

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  updatedAt?: string

  static fromDomain(
    domain: WorkPatternAssignmentWithDetails,
  ): WorkPatternAssignmentResponseDto {
    const dto = new WorkPatternAssignmentResponseDto()
    dto.holder = WorkPatternAssignmentResponseHolderDto.fromDomain(
      domain.holder,
    )
    dto.patternName = domain.patternName
    dto.id = domain.id
    dto.userId = domain.userId
    dto.workPatternId = domain.workPatternId
    dto.effectiveFrom = domain.effectiveFrom.toISOString()
    if (domain.effectiveTo !== undefined)
      dto.effectiveTo =
        domain.effectiveTo == null
          ? domain.effectiveTo
          : domain.effectiveTo.toISOString()
    if (domain.createdAt !== undefined)
      dto.createdAt =
        domain.createdAt == null
          ? domain.createdAt
          : domain.createdAt.toISOString()
    if (domain.updatedAt !== undefined)
      dto.updatedAt =
        domain.updatedAt == null
          ? domain.updatedAt
          : domain.updatedAt.toISOString()
    return dto
  }
}

export class NonWorkingDayResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String, format: 'date-time' })
  date!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  sourceCalendarId?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  createdAt?: string

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  updatedAt?: string

  static fromDomain(domain: NonWorkingDayEntity): NonWorkingDayResponseDto {
    const dto = new NonWorkingDayResponseDto()
    dto.id = domain.id
    dto.date = domain.date.toISOString()
    dto.name = domain.name
    dto.sourceCalendarId = domain.sourceCalendarId
    if (domain.createdAt !== undefined)
      dto.createdAt =
        domain.createdAt == null
          ? domain.createdAt
          : domain.createdAt.toISOString()
    if (domain.updatedAt !== undefined)
      dto.updatedAt =
        domain.updatedAt == null
          ? domain.updatedAt
          : domain.updatedAt.toISOString()
    return dto
  }
}

export class NonWorkingDayImportResponseDto {
  @ApiProperty({ type: Number })
  imported!: number

  @ApiProperty({ type: Number })
  skipped!: number

  static fromDomain(
    domain: Awaited<ReturnType<BulkUpsertNonWorkingDaysUseCase['execute']>>,
  ): NonWorkingDayImportResponseDto {
    const dto = new NonWorkingDayImportResponseDto()
    dto.imported = domain.imported
    dto.skipped = domain.skipped
    return dto
  }
}
