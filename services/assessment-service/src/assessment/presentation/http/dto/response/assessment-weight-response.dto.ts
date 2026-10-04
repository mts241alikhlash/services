import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { AssessmentWeightEntity } from '../../../../domain/entities/assessment-weight.entity.js'

export class AssessmentWeightResponseDto {
  @ApiProperty({
    enum: ['DAILY', 'MIDTERM', 'FINAL', 'ASSIGNMENT', 'PRACTICAL'],
  })
  type!: 'DAILY' | 'MIDTERM' | 'FINAL' | 'ASSIGNMENT' | 'PRACTICAL'

  @ApiProperty({ type: Number })
  weight!: number

  static fromDomain(
    domain: AssessmentWeightEntity,
  ): AssessmentWeightResponseDto {
    const dto = new AssessmentWeightResponseDto()
    dto.type = domain.type
    dto.weight = domain.weight
    return dto
  }
}
