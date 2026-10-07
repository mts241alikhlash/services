import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, MaxLength } from 'class-validator'

export class SendDocumentReviewDto {
  @ApiPropertyOptional({
    description:
      'Free note about data that is wrong, or a document to upload; returns the form to the applicant',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  dataNote?: string
}
