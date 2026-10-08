import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, MaxLength } from 'class-validator'

export class RejectDecisionDto {
  @ApiProperty({ description: 'Shown to the applicant' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason!: string
}
