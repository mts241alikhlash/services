import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator'

export class SaveDocumentDecisionDto {
  @ApiProperty({ enum: ['APPROVED', 'REJECTED'] })
  @IsIn(['APPROVED', 'REJECTED'])
  status!: 'APPROVED' | 'REJECTED'

  @ApiPropertyOptional({
    description: 'Required when the decision is REJECTED',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string
}
