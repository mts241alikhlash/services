import { ApiProperty } from '@nestjs/swagger'
import {
  MAKEUP_REASONS,
  type MakeupReason,
} from '../../../../domain/entities/exam-schedule.entity.js'
import type {
  ParticipantRow,
  ParticipantStatus,
} from '../../../../application/use-cases/makeup-participants/get-makeup-participants.use-case.js'

export const PARTICIPANT_STATUSES = [
  'WAITING',
  'SAT_REGULAR',
  'IN_PROGRESS',
  'DONE',
] as const

export class ParticipantDto {
  @ApiProperty({ format: 'uuid' }) studentId!: string
  @ApiProperty({ type: String, nullable: true }) name!: string | null
  @ApiProperty({ type: String, nullable: true }) nis!: string | null
  @ApiProperty({ enum: MAKEUP_REASONS }) reason!: MakeupReason
  @ApiProperty({ type: String, nullable: true }) note!: string | null
  @ApiProperty({ enum: PARTICIPANT_STATUSES }) status!: ParticipantStatus

  static fromDomain(domain: ParticipantRow): ParticipantDto {
    const dto = new ParticipantDto()
    dto.studentId = domain.studentId
    dto.name = domain.name
    dto.nis = domain.nis
    dto.reason = domain.reason
    dto.note = domain.note
    dto.status = domain.status
    return dto
  }
}
