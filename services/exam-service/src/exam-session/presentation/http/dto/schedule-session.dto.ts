import { ApiProperty } from '@nestjs/swagger'
import type { PaginatedResult } from '../../../../shared/domain/interfaces/repository.interface.js'
import type { ScheduleSessionRow } from '../../../application/use-cases/list-schedule-sessions/list-schedule-sessions.use-case.js'
import type { ExamSession } from '../../../domain/entities/exam-session.entity.js'

export class ScheduleSessionDto {
  @ApiProperty({ format: 'uuid' }) sessionId!: string
  @ApiProperty({ format: 'uuid' }) studentId!: string
  @ApiProperty({ type: String, nullable: true }) studentName!: string | null
  @ApiProperty({ type: String, nullable: true }) studentNis!: string | null
  @ApiProperty({ enum: ['IN_PROGRESS', 'SUBMITTED', 'EXPIRED', 'GRADED'] })
  status!: ExamSession['status']
  @ApiProperty({ format: 'date-time' }) startedAt!: string
  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  submittedAt!: string | null
  @ApiProperty({ type: Number, nullable: true }) rawScore!: number | null
  @ApiProperty({ type: Number, nullable: true }) maxScore!: number | null
  @ApiProperty({ description: 'False once a supervisor released the device' })
  deviceBound!: boolean

  static fromDomain(
    domain: ExamSession & {
      studentName?: string | null
      studentNis?: string | null
    },
  ): ScheduleSessionDto {
    const dto = new ScheduleSessionDto()
    dto.sessionId = domain.id
    dto.studentId = domain.studentId
    dto.studentName = domain.studentName ?? null
    dto.studentNis = domain.studentNis ?? null
    dto.status = domain.status
    dto.startedAt = domain.startedAt.toISOString()
    dto.submittedAt = domain.submittedAt?.toISOString() ?? null
    dto.rawScore = domain.rawScore
    dto.maxScore = domain.maxScore
    dto.deviceBound = domain.deviceId !== null
    return dto
  }
}

export class ScheduleSessionListResponseDto {
  @ApiProperty({ type: () => [ScheduleSessionDto] })
  data!: ScheduleSessionDto[]
  @ApiProperty() total!: number
  @ApiProperty() page!: number
  @ApiProperty() limit!: number

  static fromDomain(
    domain: PaginatedResult<ScheduleSessionRow>,
  ): ScheduleSessionListResponseDto {
    const dto = new ScheduleSessionListResponseDto()
    dto.data = domain.data.map((row) => ScheduleSessionDto.fromDomain(row))
    dto.total = domain.total
    dto.page = domain.page
    dto.limit = domain.limit
    return dto
  }
}
