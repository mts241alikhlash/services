import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { InventoryConditionEntity } from '../../../../domain/entities/condition.entity.js'

export class InventoryConditionResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  isUsable!: boolean

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  static fromDomain(
    domain: InventoryConditionEntity,
  ): InventoryConditionResponseDto {
    const dto = new InventoryConditionResponseDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    dto.isUsable = domain.isUsable
    dto.createdAt = domain.createdAt.toISOString()
    return dto
  }
}
