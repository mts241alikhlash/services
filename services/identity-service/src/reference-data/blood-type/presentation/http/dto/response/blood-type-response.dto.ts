import { ApiProperty } from '@nestjs/swagger'
import type { PaginationMeta } from '../../../../../../shared/domain/interfaces/repository.interface.js'

export class BloodTypeResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440012' }) id!: string
  @ApiProperty({ example: 'O+' }) name!: string
  @ApiProperty({ example: true }) isActive!: boolean
}

export class BloodTypeListResponseDto {
  @ApiProperty({ type: () => [BloodTypeResponseDto] })
  data!: BloodTypeResponseDto[]
  @ApiProperty({ example: { page: 1, limit: 10, total: 6, totalPages: 1 } })
  meta!: PaginationMeta
}

export class BloodTypeSingleResponseDto {
  @ApiProperty({ type: () => BloodTypeResponseDto })
  data!: BloodTypeResponseDto
}
