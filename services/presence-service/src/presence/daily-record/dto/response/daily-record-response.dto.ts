import type { DailyPresenceEntity } from '../../domain/entities/daily-presence.entity.js'
import type { DailyPresenceDetail } from '../../use-cases/get-daily-presences.use-case.js'
import type { RecapExportRow } from '../../use-cases/get-presence-recap.use-case.js'
import type { PresenceRecap } from '../../domain/interfaces/daily-presence-recap.interface.js'
import type { GetMyDailyPresencesUseCase } from '../../use-cases/get-daily-presences.use-case.js'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { DailyPresenceWithDetails } from '../../domain/interfaces/daily-presence-recap.interface.js'
import type { GetDailyPresencesUseCase } from '../../use-cases/get-daily-presences.use-case.js'

export class DailyPresenceListItemResponseHolderDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String, nullable: true })
  displayName!: string | null

  @ApiProperty({ type: String })
  identifier!: string

  static fromDomain(
    domain: NonNullable<DailyPresenceWithDetails['holder']>,
  ): DailyPresenceListItemResponseHolderDto {
    const dto = new DailyPresenceListItemResponseHolderDto()
    dto.id = domain.id
    dto.displayName = domain.displayName
    dto.identifier = domain.identifier
    return dto
  }
}

export class DailyPresenceListItemResponseDto {
  @ApiProperty({ type: () => DailyPresenceListItemResponseHolderDto })
  holder!: DailyPresenceListItemResponseHolderDto

  @ApiProperty({ type: Boolean })
  corrected!: boolean

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  userId!: string

  @ApiProperty({ enum: ['STUDENT', 'EMPLOYEE'] })
  subjectType!: 'STUDENT' | 'EMPLOYEE'

  @ApiProperty({ type: String, format: 'date-time' })
  date!: string

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  checkInAt?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  checkOutAt?: string | null

  @ApiPropertyOptional({ enum: ['SCAN', 'MANUAL'], nullable: true })
  checkInSource?: 'SCAN' | 'MANUAL' | null

  @ApiPropertyOptional({ enum: ['SCAN', 'MANUAL'], nullable: true })
  checkOutSource?: 'SCAN' | 'MANUAL' | null

  @ApiProperty({
    enum: [
      'PRESENT',
      'LATE',
      'ABSENT',
      'ON_LEAVE',
      'OFFICIAL_DUTY',
      'NOT_EXPECTED',
    ],
  })
  status!:
    | 'PRESENT'
    | 'LATE'
    | 'ABSENT'
    | 'ON_LEAVE'
    | 'OFFICIAL_DUTY'
    | 'NOT_EXPECTED'

  @ApiProperty({ enum: ['SCAN', 'MANUAL'] })
  statusSource!: 'SCAN' | 'MANUAL'

  @ApiProperty({ type: Number })
  lateMinutes!: number

  @ApiProperty({ type: Number })
  earlyLeaveMinutes!: number

  @ApiPropertyOptional({ type: String, nullable: true })
  workPatternId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  leaveRequestId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  note?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  createdAt?: string

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  updatedAt?: string

  static fromDomain(
    domain: DailyPresenceWithDetails,
  ): DailyPresenceListItemResponseDto {
    const dto = new DailyPresenceListItemResponseDto()
    dto.holder = DailyPresenceListItemResponseHolderDto.fromDomain(
      domain.holder,
    )
    dto.corrected = domain.corrected
    dto.id = domain.id
    dto.userId = domain.userId
    dto.subjectType = domain.subjectType
    dto.date = domain.date.toISOString()
    if (domain.checkInAt !== undefined)
      dto.checkInAt =
        domain.checkInAt == null
          ? domain.checkInAt
          : domain.checkInAt.toISOString()
    if (domain.checkOutAt !== undefined)
      dto.checkOutAt =
        domain.checkOutAt == null
          ? domain.checkOutAt
          : domain.checkOutAt.toISOString()
    dto.checkInSource = domain.checkInSource
    dto.checkOutSource = domain.checkOutSource
    dto.status = domain.status
    dto.statusSource = domain.statusSource
    dto.lateMinutes = domain.lateMinutes
    dto.earlyLeaveMinutes = domain.earlyLeaveMinutes
    dto.workPatternId = domain.workPatternId
    dto.leaveRequestId = domain.leaveRequestId
    dto.note = domain.note
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

export class DailyPresenceListResponseMetaDto {
  @ApiProperty({ type: Number })
  page!: number

  @ApiProperty({ type: Number })
  limit!: number

  @ApiProperty({ type: Number })
  total!: number

  @ApiProperty({ type: Number })
  totalPages!: number

  static fromDomain(
    domain: Awaited<ReturnType<GetDailyPresencesUseCase['execute']>>['meta'],
  ): DailyPresenceListResponseMetaDto {
    const dto = new DailyPresenceListResponseMetaDto()
    dto.page = domain.page
    dto.limit = domain.limit
    dto.total = domain.total
    dto.totalPages = domain.totalPages
    return dto
  }
}

export class DailyPresenceListResponseDto {
  @ApiProperty({ type: () => [DailyPresenceListItemResponseDto] })
  data!: DailyPresenceListItemResponseDto[]

  @ApiProperty({ type: () => DailyPresenceListResponseMetaDto })
  meta!: DailyPresenceListResponseMetaDto

  static fromDomain(
    domain: Awaited<ReturnType<GetDailyPresencesUseCase['execute']>>,
  ): DailyPresenceListResponseDto {
    const dto = new DailyPresenceListResponseDto()
    dto.data = domain.data.map((item) =>
      DailyPresenceListItemResponseDto.fromDomain(item),
    )
    dto.meta = DailyPresenceListResponseMetaDto.fromDomain(domain.meta)
    return dto
  }
}

export class MyDailyPresenceResponseDaysDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  userId!: string

  @ApiProperty({ enum: ['STUDENT', 'EMPLOYEE'] })
  subjectType!: 'STUDENT' | 'EMPLOYEE'

  @ApiProperty({ type: String, format: 'date-time' })
  date!: string

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  checkInAt?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  checkOutAt?: string | null

  @ApiPropertyOptional({ enum: ['SCAN', 'MANUAL'], nullable: true })
  checkInSource?: 'SCAN' | 'MANUAL' | null

  @ApiPropertyOptional({ enum: ['SCAN', 'MANUAL'], nullable: true })
  checkOutSource?: 'SCAN' | 'MANUAL' | null

  @ApiProperty({
    enum: [
      'PRESENT',
      'LATE',
      'ABSENT',
      'ON_LEAVE',
      'OFFICIAL_DUTY',
      'NOT_EXPECTED',
    ],
  })
  status!:
    | 'PRESENT'
    | 'LATE'
    | 'ABSENT'
    | 'ON_LEAVE'
    | 'OFFICIAL_DUTY'
    | 'NOT_EXPECTED'

  @ApiProperty({ enum: ['SCAN', 'MANUAL'] })
  statusSource!: 'SCAN' | 'MANUAL'

  @ApiProperty({ type: Number })
  lateMinutes!: number

  @ApiProperty({ type: Number })
  earlyLeaveMinutes!: number

  @ApiPropertyOptional({ type: String, nullable: true })
  workPatternId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  leaveRequestId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  note?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  createdAt?: string

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  updatedAt?: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        Awaited<ReturnType<GetMyDailyPresencesUseCase['execute']>>['days']
      >[number]
    >,
  ): MyDailyPresenceResponseDaysDto {
    const dto = new MyDailyPresenceResponseDaysDto()
    dto.id = domain.id
    dto.userId = domain.userId
    dto.subjectType = domain.subjectType
    dto.date = domain.date.toISOString()
    if (domain.checkInAt !== undefined)
      dto.checkInAt =
        domain.checkInAt == null
          ? domain.checkInAt
          : domain.checkInAt.toISOString()
    if (domain.checkOutAt !== undefined)
      dto.checkOutAt =
        domain.checkOutAt == null
          ? domain.checkOutAt
          : domain.checkOutAt.toISOString()
    dto.checkInSource = domain.checkInSource
    dto.checkOutSource = domain.checkOutSource
    dto.status = domain.status
    dto.statusSource = domain.statusSource
    dto.lateMinutes = domain.lateMinutes
    dto.earlyLeaveMinutes = domain.earlyLeaveMinutes
    dto.workPatternId = domain.workPatternId
    dto.leaveRequestId = domain.leaveRequestId
    dto.note = domain.note
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

export class MyDailyPresenceResponseDto {
  @ApiProperty({ type: Number })
  year!: number

  @ApiProperty({ type: Number })
  month!: number

  @ApiProperty({ type: () => MyDailyPresenceResponseDaysDto, isArray: true })
  days!: MyDailyPresenceResponseDaysDto[]

  static fromDomain(
    domain: Awaited<ReturnType<GetMyDailyPresencesUseCase['execute']>>,
  ): MyDailyPresenceResponseDto {
    const dto = new MyDailyPresenceResponseDto()
    dto.year = domain.year
    dto.month = domain.month
    dto.days = domain.days.map((x) =>
      MyDailyPresenceResponseDaysDto.fromDomain(x),
    )
    return dto
  }
}

export class PresenceRecapResponsePeriodDto {
  @ApiProperty({ type: Number })
  year!: number

  @ApiProperty({ type: Number })
  month!: number

  @ApiProperty({ enum: ['OPEN', 'CLOSED'] })
  status!: 'OPEN' | 'CLOSED'

  @ApiProperty({ type: Number })
  workingDays!: number

  static fromDomain(
    domain: NonNullable<PresenceRecap['period']>,
  ): PresenceRecapResponsePeriodDto {
    const dto = new PresenceRecapResponsePeriodDto()
    dto.year = domain.year
    dto.month = domain.month
    dto.status = domain.status
    dto.workingDays = domain.workingDays
    return dto
  }
}

export class PresenceRecapResponseRowsDto {
  @ApiProperty({ type: String })
  userId!: string

  @ApiProperty({ type: String, nullable: true })
  displayName!: string | null

  @ApiProperty({ type: Number })
  presentDays!: number

  @ApiProperty({ type: Number })
  absentDays!: number

  @ApiProperty({ type: Number })
  lateCount!: number

  @ApiProperty({ type: Number })
  lateMinutes!: number

  @ApiProperty({ type: Number })
  earlyLeaveCount!: number

  @ApiProperty({ type: Number })
  leaveDays!: number

  @ApiProperty({ type: Number })
  officialDutyDays!: number

  @ApiProperty({ type: Number })
  attendanceRate!: number

  static fromDomain(
    domain: NonNullable<NonNullable<PresenceRecap['rows']>[number]>,
  ): PresenceRecapResponseRowsDto {
    const dto = new PresenceRecapResponseRowsDto()
    dto.userId = domain.userId
    dto.displayName = domain.displayName
    dto.presentDays = domain.presentDays
    dto.absentDays = domain.absentDays
    dto.lateCount = domain.lateCount
    dto.lateMinutes = domain.lateMinutes
    dto.earlyLeaveCount = domain.earlyLeaveCount
    dto.leaveDays = domain.leaveDays
    dto.officialDutyDays = domain.officialDutyDays
    dto.attendanceRate = domain.attendanceRate
    return dto
  }
}

export class PresenceRecapResponseDto {
  @ApiProperty({ type: () => PresenceRecapResponsePeriodDto })
  period!: PresenceRecapResponsePeriodDto

  @ApiProperty({ type: () => PresenceRecapResponseRowsDto, isArray: true })
  rows!: PresenceRecapResponseRowsDto[]

  static fromDomain(domain: PresenceRecap): PresenceRecapResponseDto {
    const dto = new PresenceRecapResponseDto()
    dto.period = PresenceRecapResponsePeriodDto.fromDomain(domain.period)
    dto.rows = domain.rows.map((x) =>
      PresenceRecapResponseRowsDto.fromDomain(x),
    )
    return dto
  }
}

export class PresenceRecapExportRowResponseDto {
  @ApiProperty({ type: String })
  Nama!: string

  @ApiProperty({ type: Number })
  Hadir!: number

  @ApiProperty({ type: Number })
  Alpa!: number

  @ApiProperty({ type: Number })
  Terlambat!: number

  @ApiProperty({ type: Number })
  'Menit Terlambat'!: number

  @ApiProperty({ type: Number })
  'Pulang Cepat'!: number

  @ApiProperty({ type: Number })
  Izin!: number

  @ApiProperty({ type: Number })
  'Dinas Luar'!: number

  @ApiProperty({ type: Number })
  'Persentase Kehadiran'!: number

  static fromDomain(domain: RecapExportRow): PresenceRecapExportRowResponseDto {
    const dto = new PresenceRecapExportRowResponseDto()
    dto.Nama = domain.Nama
    dto.Hadir = domain.Hadir
    dto.Alpa = domain.Alpa
    dto.Terlambat = domain.Terlambat
    dto['Menit Terlambat'] = domain['Menit Terlambat']
    dto['Pulang Cepat'] = domain['Pulang Cepat']
    dto.Izin = domain.Izin
    dto['Dinas Luar'] = domain['Dinas Luar']
    dto['Persentase Kehadiran'] = domain['Persentase Kehadiran']
    return dto
  }
}

export class DailyPresenceDetailResponseCorrectionsActorDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String, nullable: true })
  displayName!: string | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<DailyPresenceDetail['corrections']>[number]
      >['actor']
    >,
  ): DailyPresenceDetailResponseCorrectionsActorDto {
    const dto = new DailyPresenceDetailResponseCorrectionsActorDto()
    dto.id = domain.id
    dto.displayName = domain.displayName
    return dto
  }
}

export class DailyPresenceDetailResponseCorrectionsDto {
  @ApiProperty({ type: () => DailyPresenceDetailResponseCorrectionsActorDto })
  actor!: DailyPresenceDetailResponseCorrectionsActorDto

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  dailyPresenceId!: string

  @ApiProperty({ enum: ['checkInAt', 'checkOutAt', 'status', 'note'] })
  field!: 'checkInAt' | 'checkOutAt' | 'status' | 'note'

  @ApiPropertyOptional({ type: String, nullable: true })
  previousValue?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  newValue?: string | null

  @ApiProperty({ type: String })
  reason!: string

  @ApiProperty({ type: String })
  actorId!: string

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<DailyPresenceDetail['corrections']>[number]
    >,
  ): DailyPresenceDetailResponseCorrectionsDto {
    const dto = new DailyPresenceDetailResponseCorrectionsDto()
    dto.actor = DailyPresenceDetailResponseCorrectionsActorDto.fromDomain(
      domain.actor,
    )
    dto.id = domain.id
    dto.dailyPresenceId = domain.dailyPresenceId
    dto.field = domain.field
    dto.previousValue = domain.previousValue
    dto.newValue = domain.newValue
    dto.reason = domain.reason
    dto.actorId = domain.actorId
    dto.createdAt = domain.createdAt.toISOString()
    return dto
  }
}

export class DailyPresenceDetailResponseDto {
  @ApiProperty({
    type: () => DailyPresenceDetailResponseCorrectionsDto,
    isArray: true,
  })
  corrections!: DailyPresenceDetailResponseCorrectionsDto[]

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  userId!: string

  @ApiProperty({ enum: ['STUDENT', 'EMPLOYEE'] })
  subjectType!: 'STUDENT' | 'EMPLOYEE'

  @ApiProperty({ type: String, format: 'date-time' })
  date!: string

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  checkInAt?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  checkOutAt?: string | null

  @ApiPropertyOptional({ enum: ['SCAN', 'MANUAL'], nullable: true })
  checkInSource?: 'SCAN' | 'MANUAL' | null

  @ApiPropertyOptional({ enum: ['SCAN', 'MANUAL'], nullable: true })
  checkOutSource?: 'SCAN' | 'MANUAL' | null

  @ApiProperty({
    enum: [
      'PRESENT',
      'LATE',
      'ABSENT',
      'ON_LEAVE',
      'OFFICIAL_DUTY',
      'NOT_EXPECTED',
    ],
  })
  status!:
    | 'PRESENT'
    | 'LATE'
    | 'ABSENT'
    | 'ON_LEAVE'
    | 'OFFICIAL_DUTY'
    | 'NOT_EXPECTED'

  @ApiProperty({ enum: ['SCAN', 'MANUAL'] })
  statusSource!: 'SCAN' | 'MANUAL'

  @ApiProperty({ type: Number })
  lateMinutes!: number

  @ApiProperty({ type: Number })
  earlyLeaveMinutes!: number

  @ApiPropertyOptional({ type: String, nullable: true })
  workPatternId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  leaveRequestId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  note?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  createdAt?: string

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  updatedAt?: string

  static fromDomain(
    domain: DailyPresenceDetail,
  ): DailyPresenceDetailResponseDto {
    const dto = new DailyPresenceDetailResponseDto()
    dto.corrections = domain.corrections.map((x) =>
      DailyPresenceDetailResponseCorrectionsDto.fromDomain(x),
    )
    dto.id = domain.id
    dto.userId = domain.userId
    dto.subjectType = domain.subjectType
    dto.date = domain.date.toISOString()
    if (domain.checkInAt !== undefined)
      dto.checkInAt =
        domain.checkInAt == null
          ? domain.checkInAt
          : domain.checkInAt.toISOString()
    if (domain.checkOutAt !== undefined)
      dto.checkOutAt =
        domain.checkOutAt == null
          ? domain.checkOutAt
          : domain.checkOutAt.toISOString()
    dto.checkInSource = domain.checkInSource
    dto.checkOutSource = domain.checkOutSource
    dto.status = domain.status
    dto.statusSource = domain.statusSource
    dto.lateMinutes = domain.lateMinutes
    dto.earlyLeaveMinutes = domain.earlyLeaveMinutes
    dto.workPatternId = domain.workPatternId
    dto.leaveRequestId = domain.leaveRequestId
    dto.note = domain.note
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

export class DailyPresenceResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  userId!: string

  @ApiProperty({ enum: ['STUDENT', 'EMPLOYEE'] })
  subjectType!: 'STUDENT' | 'EMPLOYEE'

  @ApiProperty({ type: String, format: 'date-time' })
  date!: string

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  checkInAt?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  checkOutAt?: string | null

  @ApiPropertyOptional({ enum: ['SCAN', 'MANUAL'], nullable: true })
  checkInSource?: 'SCAN' | 'MANUAL' | null

  @ApiPropertyOptional({ enum: ['SCAN', 'MANUAL'], nullable: true })
  checkOutSource?: 'SCAN' | 'MANUAL' | null

  @ApiProperty({
    enum: [
      'PRESENT',
      'LATE',
      'ABSENT',
      'ON_LEAVE',
      'OFFICIAL_DUTY',
      'NOT_EXPECTED',
    ],
  })
  status!:
    | 'PRESENT'
    | 'LATE'
    | 'ABSENT'
    | 'ON_LEAVE'
    | 'OFFICIAL_DUTY'
    | 'NOT_EXPECTED'

  @ApiProperty({ enum: ['SCAN', 'MANUAL'] })
  statusSource!: 'SCAN' | 'MANUAL'

  @ApiProperty({ type: Number })
  lateMinutes!: number

  @ApiProperty({ type: Number })
  earlyLeaveMinutes!: number

  @ApiPropertyOptional({ type: String, nullable: true })
  workPatternId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  leaveRequestId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  note?: string | null

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  createdAt?: string

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  updatedAt?: string

  static fromDomain(domain: DailyPresenceEntity): DailyPresenceResponseDto {
    const dto = new DailyPresenceResponseDto()
    dto.id = domain.id
    dto.userId = domain.userId
    dto.subjectType = domain.subjectType
    dto.date = domain.date.toISOString()
    if (domain.checkInAt !== undefined)
      dto.checkInAt =
        domain.checkInAt == null
          ? domain.checkInAt
          : domain.checkInAt.toISOString()
    if (domain.checkOutAt !== undefined)
      dto.checkOutAt =
        domain.checkOutAt == null
          ? domain.checkOutAt
          : domain.checkOutAt.toISOString()
    dto.checkInSource = domain.checkInSource
    dto.checkOutSource = domain.checkOutSource
    dto.status = domain.status
    dto.statusSource = domain.statusSource
    dto.lateMinutes = domain.lateMinutes
    dto.earlyLeaveMinutes = domain.earlyLeaveMinutes
    dto.workPatternId = domain.workPatternId
    dto.leaveRequestId = domain.leaveRequestId
    dto.note = domain.note
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
