import { ApiProperty } from '@nestjs/swagger'

export class InventoryCategoryResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string

  @ApiProperty({ example: 'ELK' }) code!: string

  @ApiProperty({ example: 'Elektronik' }) name!: string

  @ApiProperty({
    format: 'uuid',
    nullable: true,
    description: 'Categories nest; null at the top of a tree.',
  })
  parentId!: string | null

  @ApiProperty({
    type: String,
    example: '12.50',
    description:
      'A string, not a number: the column is `Decimal(5,2)`, and Prisma hands ' +
      'a Decimal back as its string form so no precision is lost on the way.',
  })
  depreciationRatePercent!: string

  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date
}
