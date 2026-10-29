import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsInt, IsOptional, Max, Min } from 'class-validator'
import type { SubmitResult } from '../../../application/use-cases/submit-exam-session/submit-exam-session.use-case.js'

export class SubmitSessionRequestDto {
  @ApiPropertyOptional({
    description:
      'Times the app saw the student leave the exam; four or more is what made the app hand the exam in',
    minimum: 0,
    maximum: 1000,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000)
  violations?: number
}

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
