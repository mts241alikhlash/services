import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { InventoryLocationEntity } from '../../../../domain/entities/location.entity.js'

export class InventoryLocationResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: String, nullable: true })
  building!: string | null

  @ApiProperty({ type: String, nullable: true })
  room!: string | null

  @ApiProperty({ type: String, nullable: true })
  rack!: string | null

  @ApiProperty({ type: String, nullable: true })
  description!: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  static fromDomain(
    domain: InventoryLocationEntity,
  ): InventoryLocationResponseDto {
    const dto = new InventoryLocationResponseDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    dto.building = domain.building
    dto.room = domain.room
    dto.rack = domain.rack
    dto.description = domain.description
    dto.createdAt = domain.createdAt.toISOString()
    return dto
  }
}
