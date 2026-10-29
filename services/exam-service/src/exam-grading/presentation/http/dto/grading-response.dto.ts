import { ApiProperty } from '@nestjs/swagger'
import {
  EXAM_TYPES,
  type ExamType,
} from '../../../../exam-schedule/domain/entities/exam-schedule.entity.js'
import type { PaginatedResult } from '../../../../shared/domain/interfaces/repository.interface.js'
import type { GradingSessionDetail } from '../../../application/use-cases/get-grading-session/get-grading-session.use-case.js'
import type { GradingItem } from '../../../application/grading-item.js'
import type { GradingSchedule } from '../../../application/use-cases/list-grading-schedules/list-grading-schedules.use-case.js'
import type { GradingSessionRow } from '../../../application/use-cases/list-grading-sessions/list-grading-sessions.use-case.js'

const SESSION_STATUSES = [
  'IN_PROGRESS',
  'SUBMITTED',
  'EXPIRED',
  'GRADED',
] as const

export class GradingScheduleDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty() title!: string
  @ApiProperty({ format: 'uuid' }) subjectId!: string
  @ApiProperty({ format: 'uuid' }) classroomId!: string
  @ApiProperty({ type: String, nullable: true }) classroomName!: string | null
  @ApiProperty({ format: 'uuid' }) semesterId!: string
  @ApiProperty({ enum: EXAM_TYPES }) type!: ExamType
  @ApiProperty({ format: 'date-time' }) startsAt!: string
  @ApiProperty({ format: 'date-time' }) endsAt!: string
  @ApiProperty() sessions!: number
  @ApiProperty() awaitingGrading!: number
  @ApiProperty() graded!: number

  static fromDomain(domain: GradingSchedule): GradingScheduleDto {
    const dto = new GradingScheduleDto()
    dto.id = domain.id
    dto.title = domain.packageTitle
    dto.subjectId = domain.subjectId
    dto.classroomId = domain.classroomId
    dto.classroomName = domain.classroomName
    dto.semesterId = domain.semesterId
    dto.type = domain.type
    dto.startsAt = domain.startsAt.toISOString()
    dto.endsAt = domain.endsAt.toISOString()
    dto.sessions = domain.sessions
    dto.awaitingGrading = domain.awaitingGrading
    dto.graded = domain.graded
    return dto
  }
}

export class GradingScheduleListResponseDto {
  @ApiProperty({ type: () => [GradingScheduleDto] }) data!: GradingScheduleDto[]
  @ApiProperty() total!: number
  @ApiProperty() page!: number
  @ApiProperty() limit!: number

  static fromDomain(
    domain: PaginatedResult<GradingSchedule>,
  ): GradingScheduleListResponseDto {
    const dto = new GradingScheduleListResponseDto()
    dto.data = domain.data.map((row) => GradingScheduleDto.fromDomain(row))
    dto.total = domain.total
    dto.page = domain.page
    dto.limit = domain.limit
    return dto
  }
}

export class GradingSessionRowDto {
  @ApiProperty({ format: 'uuid' }) sessionId!: string
  @ApiProperty({ format: 'uuid' }) studentId!: string
  @ApiProperty({ type: String, nullable: true }) studentName!: string | null
  @ApiProperty({ type: String, nullable: true }) studentNis!: string | null
  @ApiProperty({ enum: SESSION_STATUSES }) status!: GradingSessionRow['status']
  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  submittedAt!: string | null
  @ApiProperty({ type: Number, nullable: true }) rawScore!: number | null
  @ApiProperty({ type: Number, nullable: true }) maxScore!: number | null
  @ApiProperty() awaitingGrading!: boolean
  @ApiProperty({ type: String, enum: ['PENDING', 'SENT'], nullable: true })
  publication!: 'PENDING' | 'SENT' | null

  static fromDomain(domain: GradingSessionRow): GradingSessionRowDto {
    const dto = new GradingSessionRowDto()
    dto.sessionId = domain.sessionId
    dto.studentId = domain.studentId
    dto.studentName = domain.studentName
    dto.studentNis = domain.studentNis
    dto.status = domain.status
    dto.submittedAt = domain.submittedAt?.toISOString() ?? null
    dto.rawScore = domain.rawScore
    dto.maxScore = domain.maxScore
    dto.awaitingGrading = domain.awaitingGrading
    dto.publication = domain.publication
    return dto
  }
}

export class GradingSessionListResponseDto {
  @ApiProperty({ type: () => [GradingSessionRowDto] })
  data!: GradingSessionRowDto[]
  @ApiProperty() total!: number
  @ApiProperty() page!: number
  @ApiProperty() limit!: number

  static fromDomain(
    domain: PaginatedResult<GradingSessionRow>,
  ): GradingSessionListResponseDto {
    const dto = new GradingSessionListResponseDto()
    dto.data = domain.data.map((row) => GradingSessionRowDto.fromDomain(row))
    dto.total = domain.total
    dto.page = domain.page
    dto.limit = domain.limit
    return dto
  }
}

export class GradingItemDto {
  @ApiProperty({ format: 'uuid' }) questionId!: string
  @ApiProperty({ description: 'Position on the package, from 1' })
  number!: number
  @ApiProperty({ enum: ['SHORT_ANSWER', 'ESSAY'] }) type!: GradingItem['type']
  @ApiProperty() bodyHtml!: string
  @ApiProperty() points!: number
  @ApiProperty({ type: String, nullable: true }) guideHtml!: string | null
  @ApiProperty({ type: String, isArray: true, nullable: true })
  acceptedAnswers!: string[] | null
  @ApiProperty({ type: 'object', additionalProperties: true, nullable: true })
  answer!: Record<string, unknown> | null
  @ApiProperty({ type: Number, nullable: true }) score!: number | null
  @ApiProperty({ type: String, nullable: true }) note!: string | null
  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  gradedAt!: string | null
  @ApiProperty() needsGrading!: boolean

  static fromDomain(domain: GradingItem): GradingItemDto {
    const dto = new GradingItemDto()
    dto.questionId = domain.questionId
    dto.number = domain.number
    dto.type = domain.type
    dto.bodyHtml = domain.bodyHtml
    dto.points = domain.points
    dto.guideHtml = domain.guideHtml
    dto.acceptedAnswers = domain.acceptedAnswers
    dto.answer = domain.answer ? { ...domain.answer } : null
    dto.score = domain.score
    dto.note = domain.note
    dto.gradedAt = domain.gradedAt?.toISOString() ?? null
    dto.needsGrading = domain.needsGrading
    return dto
  }
}

export class GradingSessionSummaryDto {
  @ApiProperty({ format: 'uuid' }) sessionId!: string
  @ApiProperty({ format: 'uuid' }) scheduleId!: string
  @ApiProperty({ format: 'uuid' }) studentId!: string
  @ApiProperty({ type: String, nullable: true }) studentName!: string | null
  @ApiProperty({ type: String, nullable: true }) studentNis!: string | null
  @ApiProperty({ enum: SESSION_STATUSES }) status!: string
  @ApiProperty({ type: Number, nullable: true }) rawScore!: number | null
  @ApiProperty({ type: Number, nullable: true }) maxScore!: number | null
}

export class GradingSessionDetailDto {
  @ApiProperty({ type: () => GradingSessionSummaryDto })
  session!: GradingSessionSummaryDto
  @ApiProperty({ type: () => [GradingItemDto] }) items!: GradingItemDto[]

  static fromDomain(domain: GradingSessionDetail): GradingSessionDetailDto {
    const dto = new GradingSessionDetailDto()
    dto.session = { ...domain.session }
    dto.items = domain.items.map((item) => GradingItemDto.fromDomain(item))
    return dto
  }
}
