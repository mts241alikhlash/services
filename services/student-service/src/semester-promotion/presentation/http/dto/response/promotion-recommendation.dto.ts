import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { PromotionAction } from '../../../../domain/enums/promotion-action.enum.js'
import { PromotionRecommendationResult } from '../../../../application/use-cases/generate-promotion-recommendation/generate-promotion-recommendation.result.js'

export class PromotionRecommendationItemDto {
  @ApiProperty() studentId: string
  @ApiProperty() studentName: string
  @ApiProperty() nis: string
  @ApiProperty() sourceClassroomId: string
  @ApiProperty() sourceClassroomName: string
  @ApiProperty() sourceLevel: string
  @ApiProperty({ enum: PromotionAction }) recommendedAction: PromotionAction
  @ApiPropertyOptional() targetClassroomId?: string
  @ApiPropertyOptional() targetClassroomName?: string
  @ApiPropertyOptional() targetLevel?: string
  @ApiPropertyOptional() averageScore?: number | null
}

export class PromotionRecommendationDto {
  @ApiProperty({ type: [PromotionRecommendationItemDto] })
  items: PromotionRecommendationItemDto[]

  @ApiProperty() totalStudents: number

  @ApiProperty({
    description:
      'Final-year students excluded from this run; graduate them under Kelulusan',
  })
  excludedGraduatingCount: number

  static fromResult(
    result: PromotionRecommendationResult,
  ): PromotionRecommendationDto {
    const dto = new PromotionRecommendationDto()
    dto.items = result.items
    dto.totalStudents = result.totalStudents
    dto.excludedGraduatingCount = result.excludedGraduatingCount
    return dto
  }
}
