import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { EnrolExistingAccountUseCase } from '../../../../application/use-cases/enrol-existing-account/enrol-existing-account.use-case.js'

export class EnrolExistingAccountResponseDto {
  @ApiProperty({ type: String })
  studentId!: string

  @ApiProperty({ type: Number })
  parentsLinked!: number

  @ApiProperty({ type: Boolean })
  enrollmentCreated!: boolean

  @ApiProperty({ type: Boolean })
  alreadyEnrolled!: boolean

  static fromDomain(
    domain: Awaited<ReturnType<EnrolExistingAccountUseCase['execute']>>,
  ): EnrolExistingAccountResponseDto {
    const dto = new EnrolExistingAccountResponseDto()
    dto.studentId = domain.studentId
    dto.parentsLinked = domain.parentsLinked
    dto.enrollmentCreated = domain.enrollmentCreated
    dto.alreadyEnrolled = domain.alreadyEnrolled
    return dto
  }
}
