import type { PaginationMeta } from '../../../../../shared/domain/interfaces/repository.interface.js'
import { ApiProperty } from '@nestjs/swagger'
import { AcademicYear } from '../../../../domain/entities/academic-year.entity.js'

export class AcademicYearResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440009' })
  id!: string

  @ApiProperty({ example: '2024/2025' })
  name!: string

  @ApiProperty({
    example: 2024,
    description: 'Calendar year this year opens in',
  })
  startYear!: number

  @ApiProperty({ example: true })
  isActive!: boolean

  static fromDomain(entity: AcademicYear): AcademicYearResponseDto {
    const dto = new AcademicYearResponseDto()
    dto.id = entity.id
    dto.name = entity.name
    dto.startYear = entity.startYear
    dto.isActive = entity.isActive
    return dto
  }
}

export class AcademicYearListResponseDto {
  @ApiProperty({ type: () => [AcademicYearResponseDto] })
  data!: AcademicYearResponseDto[]

  @ApiProperty({ example: { page: 1, limit: 10, total: 5, totalPages: 1 } })
  meta!: PaginationMeta
}
