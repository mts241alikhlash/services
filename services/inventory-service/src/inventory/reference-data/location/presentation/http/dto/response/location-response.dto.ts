import { ApiProperty } from '@nestjs/swagger'

export class InventoryLocationResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string

  @ApiProperty({ example: 'LAB1' }) code!: string

  @ApiProperty({ example: 'Laboratorium 1' }) name!: string

  @ApiProperty({ example: 'Gedung A', nullable: true })
  building!: string | null

  @ApiProperty({ example: 'R-08', nullable: true }) room!: string | null

  @ApiProperty({ example: 'Rak 3', nullable: true }) rack!: string | null

  @ApiProperty({ nullable: true }) description!: string | null

  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date
}
