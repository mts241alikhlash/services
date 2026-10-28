import { ApiProperty } from '@nestjs/swagger'
import type { MyExam } from '../../../application/use-cases/list-my-exams/list-my-exams.use-case.js'

const MY_EXAM_STATUSES = [
  'UPCOMING',
  'OPEN',
  'IN_PROGRESS',
  'FINISHED',
] as const

export class MyExamDto {
  @ApiProperty({ format: 'uuid', description: 'The schedule id' }) id!: string
  @ApiProperty() title!: string
  @ApiProperty({ format: 'uuid' }) subjectId!: string
  @ApiProperty({ format: 'date-time' }) startsAt!: string
  @ApiProperty({ format: 'date-time' }) endsAt!: string
  @ApiProperty() durationMinutes!: number
  @ApiProperty({ enum: MY_EXAM_STATUSES }) status!: MyExam['status']
  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  sessionId!: string | null

  static fromDomain(domain: MyExam): MyExamDto {
    const dto = new MyExamDto()
    dto.id = domain.id
    dto.title = domain.title
    dto.subjectId = domain.subjectId
    dto.startsAt = domain.startsAt.toISOString()
    dto.endsAt = domain.endsAt.toISOString()
    dto.durationMinutes = domain.durationMinutes
    dto.status = domain.status
    dto.sessionId = domain.sessionId
    return dto
  }
}
