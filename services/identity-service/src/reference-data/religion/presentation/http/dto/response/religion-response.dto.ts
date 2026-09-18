import { ApiProperty } from '@nestjs/swagger'
import type { PaginationMeta } from '../../../../../../shared/domain/interfaces/repository.interface.js'

export class ReligionResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440012' }) id!: string
  @ApiProperty({ example: 'Islam' }) name!: string
  @ApiProperty({ example: true }) isActive!: boolean
}

export class ReligionListResponseDto {
  @ApiProperty({ type: () => [ReligionResponseDto] })
  data!: ReligionResponseDto[]
  @ApiProperty({ example: { page: 1, limit: 10, total: 6, totalPages: 1 } })
  meta!: PaginationMeta
}

export class ReligionSingleResponseDto {
  @ApiProperty({ type: () => ReligionResponseDto })
  data!: ReligionResponseDto
}
