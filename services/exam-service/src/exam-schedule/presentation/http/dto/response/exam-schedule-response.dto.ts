import { ApiProperty } from '@nestjs/swagger'
import {
  EXAM_SCHEDULE_KINDS,
  EXAM_SCHEDULE_STATUSES,
  EXAM_TYPES,
  type ExamScheduleKind,
  type ExamScheduleStatus,
  type ExamType,
  type ExamScheduleView,
} from '../../../../domain/entities/exam-schedule.entity.js'

export class ExamScheduleDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty({ format: 'uuid' }) packageId!: string
  @ApiProperty() packageTitle!: string
  @ApiProperty({ format: 'uuid' }) classroomId!: string
  @ApiProperty({ type: String, nullable: true }) classroomName!: string | null
  @ApiProperty({ format: 'uuid' }) semesterId!: string
  @ApiProperty({ format: 'date-time' }) startsAt!: string
  @ApiProperty({ format: 'date-time' }) endsAt!: string
  @ApiProperty() durationMinutes!: number
  @ApiProperty({ enum: EXAM_TYPES }) type!: ExamType
  @ApiProperty({ enum: EXAM_SCHEDULE_KINDS }) kind!: ExamScheduleKind
  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  makeupOfId!: string | null
  @ApiProperty({ enum: EXAM_SCHEDULE_STATUSES }) status!: ExamScheduleStatus
  @ApiProperty({ format: 'uuid' }) createdById!: string
  @ApiProperty({
    description: 'True once a student started: it can no longer be cancelled',
  })
  hasSessions!: boolean
  @ApiProperty({ format: 'date-time' }) createdAt!: string
  @ApiProperty({ format: 'date-time' }) updatedAt!: string

  static fromDomain(
    domain: Omit<ExamScheduleView, 'classroomName'> & {
      classroomName?: string | null
    },
  ): ExamScheduleDto {
    const dto = new ExamScheduleDto()
    dto.id = domain.id
    dto.packageId = domain.packageId
    dto.packageTitle = domain.packageTitle
    dto.classroomId = domain.classroomId
    dto.classroomName = domain.classroomName ?? null
    dto.semesterId = domain.semesterId
    dto.startsAt = domain.startsAt.toISOString()
    dto.endsAt = domain.endsAt.toISOString()
    dto.durationMinutes = domain.durationMinutes
    dto.type = domain.type
    dto.kind = domain.kind
    dto.makeupOfId = domain.makeupOfId
    dto.status = domain.status
    dto.hasSessions = domain.hasSessions ?? false
    dto.createdById = domain.createdById
    dto.createdAt = domain.createdAt.toISOString()
    dto.updatedAt = domain.updatedAt.toISOString()
    return dto
  }
}

export class ExamScheduleListResponseDto {
  @ApiProperty({ type: () => [ExamScheduleDto] }) data!: ExamScheduleDto[]
  @ApiProperty() total!: number
  @ApiProperty() page!: number
  @ApiProperty() limit!: number

  static fromDomain(domain: {
    data: ExamScheduleView[]
    total: number
    page: number
    limit: number
  }): ExamScheduleListResponseDto {
    const dto = new ExamScheduleListResponseDto()
    dto.data = domain.data.map((row) => ExamScheduleDto.fromDomain(row))
    dto.total = domain.total
    dto.page = domain.page
    dto.limit = domain.limit
    return dto
  }
}

export class AccessCodeDto {
  @ApiProperty({ example: 'K7M2QX' }) accessCode!: string
  @ApiProperty() rotation!: number

  static of(accessCode: string, rotation: number): AccessCodeDto {
    const dto = new AccessCodeDto()
    dto.accessCode = accessCode
    dto.rotation = rotation
    return dto
  }
}
