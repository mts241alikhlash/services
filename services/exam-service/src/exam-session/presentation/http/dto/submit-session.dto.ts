import { ApiProperty } from '@nestjs/swagger'
import type { SubmitResult } from '../../../application/use-cases/submit-exam-session/submit-exam-session.use-case.js'

export class SubmittedSessionDto {
  @ApiProperty({ enum: ['SUBMITTED', 'EXPIRED', 'GRADED'] }) status!: string
  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  submittedAt!: string | null

  static fromDomain(domain: SubmitResult): SubmittedSessionDto {
    const dto = new SubmittedSessionDto()
    dto.status = domain.status
    dto.submittedAt = domain.submittedAt?.toISOString() ?? null
    return dto
  }
}
