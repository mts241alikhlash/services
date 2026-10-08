import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, MaxLength } from 'class-validator'

export class AcceptDecisionDto {
  @ApiPropertyOptional({ description: 'Shown to the applicant' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string
}
