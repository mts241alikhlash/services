import type { BulkAttendanceResult } from '../../../../domain/repositories/attendance.repository.js'
import type { AttendanceMonthlyTrendPoint } from '../../../../domain/repositories/attendance.repository.js'
import type { AttendanceRecapRow } from '../../../../domain/repositories/attendance.repository.js'
import type { AttendanceSuggestionResult } from '../../../../application/use-cases/get-attendance-suggestions/get-attendance-suggestions.use-case.js'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { AttendanceWithDetails } from '../../../../domain/entities/attendance.entity.js'

export class AttendanceResponseScheduleTeachingAssignmentSubjectDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String, nullable: true })
  code!: string | null

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<AttendanceWithDetails['schedule']>['teachingAssignment']
      >['subject']
    >,
  ): AttendanceResponseScheduleTeachingAssignmentSubjectDto {
    const dto = new AttendanceResponseScheduleTeachingAssignmentSubjectDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    return dto
  }
}

export class AttendanceResponseScheduleTeachingAssignmentClassroomDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String, nullable: true })
  name!: string | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<AttendanceWithDetails['schedule']>['teachingAssignment']
      >['classroom']
    >,
  ): AttendanceResponseScheduleTeachingAssignmentClassroomDto {
    const dto = new AttendanceResponseScheduleTeachingAssignmentClassroomDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    return dto
  }
}

export class AttendanceResponseScheduleTeachingAssignmentDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiPropertyOptional({
    type: () => AttendanceResponseScheduleTeachingAssignmentSubjectDto,
  })
  subject?: AttendanceResponseScheduleTeachingAssignmentSubjectDto

  @ApiPropertyOptional({
    type: () => AttendanceResponseScheduleTeachingAssignmentClassroomDto,
  })
  classroom?: AttendanceResponseScheduleTeachingAssignmentClassroomDto

  static fromDomain(
    domain: NonNullable<
      NonNullable<AttendanceWithDetails['schedule']>['teachingAssignment']
    >,
  ): AttendanceResponseScheduleTeachingAssignmentDto {
    const dto = new AttendanceResponseScheduleTeachingAssignmentDto()
    dto.id = domain.id
    if (domain.subject !== undefined)
      dto.subject =
        domain.subject == null
          ? domain.subject
          : AttendanceResponseScheduleTeachingAssignmentSubjectDto.fromDomain(
              domain.subject,
            )
    if (domain.classroom !== undefined)
      dto.classroom =
        domain.classroom == null
          ? domain.classroom
          : AttendanceResponseScheduleTeachingAssignmentClassroomDto.fromDomain(
              domain.classroom,
            )
    return dto
  }
}

export class AttendanceResponseScheduleDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  teachingAssignmentId!: string

  @ApiProperty({ type: String })
  timeSlotId!: string

  @ApiPropertyOptional({
    type: () => AttendanceResponseScheduleTeachingAssignmentDto,
  })
  teachingAssignment?: AttendanceResponseScheduleTeachingAssignmentDto

  static fromDomain(
    domain: NonNullable<AttendanceWithDetails['schedule']>,
  ): AttendanceResponseScheduleDto {
    const dto = new AttendanceResponseScheduleDto()
    dto.id = domain.id
    dto.teachingAssignmentId = domain.teachingAssignmentId
    dto.timeSlotId = domain.timeSlotId
    if (domain.teachingAssignment !== undefined)
      dto.teachingAssignment =
        domain.teachingAssignment == null
          ? domain.teachingAssignment
          : AttendanceResponseScheduleTeachingAssignmentDto.fromDomain(
              domain.teachingAssignment,
            )
    return dto
  }
}

export class AttendanceResponseEnrollmentStudentUserProfileDto {
  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          NonNullable<AttendanceWithDetails['enrollment']>['student']
        >['user']
      >['profile']
    >,
  ): AttendanceResponseEnrollmentStudentUserProfileDto {
    const dto = new AttendanceResponseEnrollmentStudentUserProfileDto()
    dto.name = domain.name
    return dto
  }
}

export class AttendanceResponseEnrollmentStudentUserDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiPropertyOptional({
    type: () => AttendanceResponseEnrollmentStudentUserProfileDto,
    nullable: true,
  })
  profile?: AttendanceResponseEnrollmentStudentUserProfileDto | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<AttendanceWithDetails['enrollment']>['student']
      >['user']
    >,
  ): AttendanceResponseEnrollmentStudentUserDto {
    const dto = new AttendanceResponseEnrollmentStudentUserDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    dto.isActive = domain.isActive
    if (domain.profile !== undefined)
      dto.profile =
        domain.profile == null
          ? domain.profile
          : AttendanceResponseEnrollmentStudentUserProfileDto.fromDomain(
              domain.profile,
            )
    return dto
  }
}

export class AttendanceResponseEnrollmentStudentDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  userId!: string

  @ApiPropertyOptional({
    type: () => AttendanceResponseEnrollmentStudentUserDto,
  })
  user?: AttendanceResponseEnrollmentStudentUserDto

  static fromDomain(
    domain: NonNullable<
      NonNullable<AttendanceWithDetails['enrollment']>['student']
    >,
  ): AttendanceResponseEnrollmentStudentDto {
    const dto = new AttendanceResponseEnrollmentStudentDto()
    dto.id = domain.id
    dto.userId = domain.userId
    if (domain.user !== undefined)
      dto.user =
        domain.user == null
          ? domain.user
          : AttendanceResponseEnrollmentStudentUserDto.fromDomain(domain.user)
    return dto
  }
}

export class AttendanceResponseEnrollmentDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  studentId!: string

  @ApiProperty({ type: String })
  classroomId!: string

  @ApiProperty({ type: String })
  semesterId!: string

  @ApiPropertyOptional({ type: () => AttendanceResponseEnrollmentStudentDto })
  student?: AttendanceResponseEnrollmentStudentDto

  static fromDomain(
    domain: NonNullable<AttendanceWithDetails['enrollment']>,
  ): AttendanceResponseEnrollmentDto {
    const dto = new AttendanceResponseEnrollmentDto()
    dto.id = domain.id
    dto.studentId = domain.studentId
    dto.classroomId = domain.classroomId
    dto.semesterId = domain.semesterId
    if (domain.student !== undefined)
      dto.student =
        domain.student == null
          ? domain.student
          : AttendanceResponseEnrollmentStudentDto.fromDomain(domain.student)
    return dto
  }
}

export class AttendanceResponseDto {
  @ApiPropertyOptional({
    type: () => AttendanceResponseScheduleDto,
    nullable: true,
  })
  schedule?: AttendanceResponseScheduleDto | null

  @ApiPropertyOptional({ type: () => AttendanceResponseEnrollmentDto })
  enrollment?: AttendanceResponseEnrollmentDto

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  enrollmentId!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  scheduleId?: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  date!: string

  @ApiProperty({ enum: ['PRESENT', 'SICK', 'EXCUSED', 'ABSENT', 'LATE'] })
  status!: 'PRESENT' | 'SICK' | 'EXCUSED' | 'ABSENT' | 'LATE'

  @ApiPropertyOptional({ type: String, nullable: true })
  note?: string | null

  static fromDomain(domain: AttendanceWithDetails): AttendanceResponseDto {
    const dto = new AttendanceResponseDto()
    if (domain.schedule !== undefined)
      dto.schedule =
        domain.schedule == null
          ? domain.schedule
          : AttendanceResponseScheduleDto.fromDomain(domain.schedule)
    if (domain.enrollment !== undefined)
      dto.enrollment =
        domain.enrollment == null
          ? domain.enrollment
          : AttendanceResponseEnrollmentDto.fromDomain(domain.enrollment)
    dto.id = domain.id
    dto.enrollmentId = domain.enrollmentId
    dto.scheduleId = domain.scheduleId
    dto.date = domain.date.toISOString()
    dto.status = domain.status
    dto.note = domain.note
    return dto
  }
}

export class AttendanceListResponseDto {
  @ApiProperty({ type: () => [AttendanceResponseDto] })
  data!: AttendanceResponseDto[]

  @ApiProperty({ type: Number })
  total!: number

  @ApiProperty({ type: Number })
  page!: number

  @ApiProperty({ type: Number })
  limit!: number

  static fromDomain(domain: {
    data: AttendanceWithDetails[]
    total: number
    page: number
    limit: number
  }): AttendanceListResponseDto {
    const dto = new AttendanceListResponseDto()
    dto.data = domain.data.map((item) => AttendanceResponseDto.fromDomain(item))
    dto.total = domain.total
    dto.page = domain.page
    dto.limit = domain.limit
    return dto
  }
}

export class AttendanceSuggestionsResponseSuggestionsDto {
  @ApiProperty({ type: String })
  enrollmentId!: string

  @ApiProperty({ enum: ['PRESENT', 'LATE'] })
  suggestedStatus!: 'PRESENT' | 'LATE'

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  checkInAt!: string | null

  @ApiProperty({ type: Number })
  lateMinutes!: number

  static fromDomain(
    domain: NonNullable<AttendanceSuggestionResult['suggestions'][number]>,
  ): AttendanceSuggestionsResponseSuggestionsDto {
    const dto = new AttendanceSuggestionsResponseSuggestionsDto()
    dto.enrollmentId = domain.enrollmentId
    dto.suggestedStatus = domain.suggestedStatus
    dto.checkInAt =
      domain.checkInAt == null
        ? domain.checkInAt
        : domain.checkInAt.toISOString()
    dto.lateMinutes = domain.lateMinutes
    return dto
  }
}

export class AttendanceSuggestionsResponseDto {
  @ApiProperty({ type: String })
  date!: string

  @ApiProperty({
    type: () => AttendanceSuggestionsResponseSuggestionsDto,
    isArray: true,
  })
  suggestions!: AttendanceSuggestionsResponseSuggestionsDto[]

  @ApiProperty({ type: String, isArray: true })
  unscannedEnrollmentIds!: string[]

  @ApiProperty({ type: Boolean })
  available!: boolean

  static fromDomain(
    domain: AttendanceSuggestionResult,
  ): AttendanceSuggestionsResponseDto {
    const dto = new AttendanceSuggestionsResponseDto()
    dto.date = domain.date
    dto.suggestions = domain.suggestions.map((x) =>
      AttendanceSuggestionsResponseSuggestionsDto.fromDomain(x),
    )
    dto.unscannedEnrollmentIds = [...domain.unscannedEnrollmentIds]
    dto.available = domain.available
    return dto
  }
}

export class AttendanceRecapResponseDto {
  @ApiProperty({ type: String })
  enrollmentId!: string

  @ApiPropertyOptional({ type: String })
  studentName?: string

  @ApiProperty({ type: Number })
  PRESENT!: number

  @ApiProperty({ type: Number })
  SICK!: number

  @ApiProperty({ type: Number })
  EXCUSED!: number

  @ApiProperty({ type: Number })
  ABSENT!: number

  @ApiProperty({ type: Number })
  LATE!: number

  @ApiProperty({ type: Number })
  total!: number

  @ApiProperty({ type: Number })
  percentage!: number

  static fromDomain(domain: AttendanceRecapRow): AttendanceRecapResponseDto {
    const dto = new AttendanceRecapResponseDto()
    dto.enrollmentId = domain.enrollmentId
    dto.studentName = domain.studentName
    dto.PRESENT = domain.PRESENT
    dto.SICK = domain.SICK
    dto.EXCUSED = domain.EXCUSED
    dto.ABSENT = domain.ABSENT
    dto.LATE = domain.LATE
    dto.total = domain.total
    dto.percentage = domain.percentage
    return dto
  }
}

export class AttendanceTrendResponseDto {
  @ApiProperty({ type: Number })
  year!: number

  @ApiProperty({ type: Number })
  month!: number

  @ApiProperty({ type: String })
  monthLabel!: string

  @ApiProperty({ type: Number })
  PRESENT!: number

  @ApiProperty({ type: Number })
  SICK!: number

  @ApiProperty({ type: Number })
  EXCUSED!: number

  @ApiProperty({ type: Number })
  ABSENT!: number

  @ApiProperty({ type: Number })
  LATE!: number

  @ApiProperty({ type: Number })
  total!: number

  @ApiProperty({ type: Number })
  percentage!: number

  static fromDomain(
    domain: AttendanceMonthlyTrendPoint,
  ): AttendanceTrendResponseDto {
    const dto = new AttendanceTrendResponseDto()
    dto.year = domain.year
    dto.month = domain.month
    dto.monthLabel = domain.monthLabel
    dto.PRESENT = domain.PRESENT
    dto.SICK = domain.SICK
    dto.EXCUSED = domain.EXCUSED
    dto.ABSENT = domain.ABSENT
    dto.LATE = domain.LATE
    dto.total = domain.total
    dto.percentage = domain.percentage
    return dto
  }
}

export class AttendanceBulkResultResponseDto {
  @ApiProperty({ type: Number })
  saved!: number

  static fromDomain(
    domain: BulkAttendanceResult,
  ): AttendanceBulkResultResponseDto {
    const dto = new AttendanceBulkResultResponseDto()
    dto.saved = domain.saved
    return dto
  }
}
