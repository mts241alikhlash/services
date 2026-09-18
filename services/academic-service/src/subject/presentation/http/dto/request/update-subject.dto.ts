import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, MaxLength } from 'class-validator'

export class UpdateSubjectDto {
  @ApiPropertyOptional({
    description: 'Subject Code (unique, e.g. MTK, IPA)',
    example: 'MTK',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  code?: string

  @ApiPropertyOptional({ description: 'Subject Name', example: 'Physics' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string
}
