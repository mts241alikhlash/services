import { ApiProperty } from '@nestjs/swagger'

export class InventoryFundingSourceResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string

  @ApiProperty({ example: 'BOS' }) code!: string

  @ApiProperty({ example: 'Dana BOS' }) name!: string

  @ApiProperty({ nullable: true }) description!: string | null

  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date
}
