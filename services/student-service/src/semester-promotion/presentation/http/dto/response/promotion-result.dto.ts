import { ApiProperty } from '@nestjs/swagger'
import { PromotionResult } from '../../../../domain/repositories/promotion.repository.js'

export class PromotionResultDto {
  @ApiProperty() promoted: number
  @ApiProperty() repeated: number
  @ApiProperty() skipped: number

  static fromResult(result: PromotionResult): PromotionResultDto {
    const dto = new PromotionResultDto()
    dto.promoted = result.promoted
    dto.repeated = result.repeated
    dto.skipped = result.skipped
    return dto
  }
}
