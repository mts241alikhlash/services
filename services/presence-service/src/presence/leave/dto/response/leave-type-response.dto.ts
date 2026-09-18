import { ApiProperty } from '@nestjs/swagger'
import { LeaveTreatment, PresenceSubjectType } from '@prisma/client'

export class LeaveTypeResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string

  @ApiProperty({ example: 'SAKIT' }) code!: string

  @ApiProperty({ example: 'Sakit' }) name!: string

  @ApiProperty({
    enum: LeaveTreatment,
    description: 'How a day under this leave is counted.',
  })
  treatment!: LeaveTreatment

  @ApiProperty({ example: true }) consumesQuota!: boolean

  @ApiProperty({
    example: 12,
    nullable: true,
    description:
      'Null when the leave is not capped, or does not consume quota.',
  })
  annualQuota!: number | null

  @ApiProperty({ example: true }) requiresDocument!: boolean

  @ApiProperty({
    enum: PresenceSubjectType,
    description: 'Whether this leave is for staff, students, or both.',
  })
  appliesTo!: PresenceSubjectType

  @ApiProperty({
    example: true,
    description:
      'Retired kinds stay on record so past requests keep their meaning; the ' +
      'list hides them unless asked for.',
  })
  isActive!: boolean

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  deletedAt!: Date | null
}
