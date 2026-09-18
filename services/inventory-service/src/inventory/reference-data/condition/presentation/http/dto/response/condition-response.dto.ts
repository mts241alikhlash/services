import { ApiProperty } from '@nestjs/swagger'

export class InventoryConditionResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string

  @ApiProperty({ example: 'BAIK' }) code!: string

  @ApiProperty({ example: 'Baik' }) name!: string

  @ApiProperty({
    example: true,
    description: 'Whether an asset in this condition may still be lent out.',
  })
  isUsable!: boolean

  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date
}
