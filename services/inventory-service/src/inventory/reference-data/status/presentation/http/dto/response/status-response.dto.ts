import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { StatusRepositoryOutput } from '../../../../domain/repositories/status.repository.js'

export class InventoryStatusResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  allowTransactions!: boolean

  @ApiProperty({
    enum: [
      'AVAILABLE',
      'LOANED',
      'LOAN_PENDING',
      'LOAN_APPROVED',
      'LOAN_REJECTED',
      'LOAN_RETURNED',
    ],
    nullable: true,
  })
  systemKey!:
    | 'AVAILABLE'
    | 'LOANED'
    | 'LOAN_PENDING'
    | 'LOAN_APPROVED'
    | 'LOAN_REJECTED'
    | 'LOAN_RETURNED'
    | null

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  static fromDomain(
    domain: StatusRepositoryOutput,
  ): InventoryStatusResponseDto {
    const dto = new InventoryStatusResponseDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    dto.allowTransactions = domain.allowTransactions
    dto.systemKey = domain.systemKey
    dto.createdAt = domain.createdAt.toISOString()
    return dto
  }
}
