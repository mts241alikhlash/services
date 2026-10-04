import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { InventoryCategoryEntity } from '../../../../domain/entities/category.entity.js'

export class InventoryCategoryResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: String, nullable: true })
  parentId!: string | null

  @ApiProperty({ type: String })
  depreciationRatePercent!: string

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  static fromDomain(
    domain: InventoryCategoryEntity,
  ): InventoryCategoryResponseDto {
    const dto = new InventoryCategoryResponseDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    dto.parentId = domain.parentId
    dto.depreciationRatePercent = domain.depreciationRatePercent
    dto.createdAt = domain.createdAt.toISOString()
    return dto
  }
}
