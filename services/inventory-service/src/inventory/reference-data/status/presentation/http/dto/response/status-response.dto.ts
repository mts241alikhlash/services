import { ApiProperty } from '@nestjs/swagger'
import { InventoryStatusKey } from '../../../../../../../shared/domain/enums/inventory-status-key.enum.js'

export class InventoryStatusResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string

  @ApiProperty({ example: 'TERSEDIA' }) code!: string

  @ApiProperty({ example: 'Tersedia' }) name!: string

  @ApiProperty({
    example: true,
    description: 'Whether an asset in this status may be borrowed or returned.',
  })
  allowTransactions!: boolean

  @ApiProperty({
    enum: InventoryStatusKey,
    nullable: true,
    description:
      'Set only on the statuses the workflow reasons about, so renaming one ' +
      'in the interface cannot change what the code does with it.',
  })
  systemKey!: InventoryStatusKey | null

  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date
}
