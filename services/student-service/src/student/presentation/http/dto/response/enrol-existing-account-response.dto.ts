import { ApiProperty } from '@nestjs/swagger'

export class EnrolExistingAccountResponseDto {
  @ApiProperty({ description: 'The student row this account now points at' })
  studentId: string

  @ApiProperty({ description: 'Parents created or reused and linked' })
  parentsLinked: number

  @ApiProperty({ description: 'Whether a classroom enrolment was created' })
  enrollmentCreated: boolean

  @ApiProperty({
    description:
      'True when the account was already a student and nothing was written. The caller may retry safely; this is what makes that true.',
  })
  alreadyEnrolled: boolean
}
