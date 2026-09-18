import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsUUID } from 'class-validator'

export class GenerateRecommendationDto {
  @ApiProperty({
    description: 'Academic year the students are leaving, e.g. 2025/2026',
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  sourceAcademicYearId: string

  @ApiProperty({
    description: 'Academic year the students are entering, e.g. 2026/2027',
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  targetAcademicYearId: string
}
