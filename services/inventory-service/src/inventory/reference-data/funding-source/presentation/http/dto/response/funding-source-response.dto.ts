import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { InventoryFundingSourceEntity } from '../../../../domain/entities/funding-source.entity.js'

export class InventoryFundingSourceResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: String, nullable: true })
  description!: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  static fromDomain(
    domain: InventoryFundingSourceEntity,
  ): InventoryFundingSourceResponseDto {
    const dto = new InventoryFundingSourceResponseDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    dto.description = domain.description
    dto.createdAt = domain.createdAt.toISOString()
    return dto
  }
}
