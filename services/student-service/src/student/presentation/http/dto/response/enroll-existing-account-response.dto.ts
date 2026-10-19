import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { EnrollExistingAccountUseCase } from '../../../../application/use-cases/enroll-existing-account/enroll-existing-account.use-case.js'

export class EnrollExistingAccountResponseDto {
  @ApiProperty({ type: String })
  studentId!: string

  @ApiProperty({ type: Number })
  parentsLinked!: number

  @ApiProperty({ type: Boolean })
  enrollmentCreated!: boolean

  @ApiProperty({ type: Boolean })
  alreadyEnrolled!: boolean

  static fromDomain(
    domain: Awaited<ReturnType<EnrollExistingAccountUseCase['execute']>>,
  ): EnrollExistingAccountResponseDto {
    const dto = new EnrollExistingAccountResponseDto()
    dto.studentId = domain.studentId
    dto.parentsLinked = domain.parentsLinked
    dto.enrollmentCreated = domain.enrollmentCreated
    dto.alreadyEnrolled = domain.alreadyEnrolled
    return dto
  }
}
