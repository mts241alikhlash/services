import { ApiProperty } from '@nestjs/swagger'
import type { PositionCategoryEntity } from '../../../../domain/entities/position-category.entity.js'
import type { PaginationMeta } from '../../../../../../shared/domain/interfaces/repository.interface.js'

export class PositionCategoryResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440007' }) id!: string
  @ApiProperty({ example: 'MANAGEMENT' }) code!: string
  @ApiProperty({ example: 'Management' }) name!: string

  static fromDomain(
    category: PositionCategoryEntity,
  ): PositionCategoryResponseDto {
    const dto = new PositionCategoryResponseDto()
    dto.id = category.id
    dto.code = category.code
    dto.name = category.name
    return dto
  }
}

export class PositionCategoryListResponseDto {
  @ApiProperty({ type: () => [PositionCategoryResponseDto] })
  data!: PositionCategoryResponseDto[]
  @ApiProperty({ example: { page: 1, limit: 10, total: 4, totalPages: 1 } })
  meta!: PaginationMeta
}
