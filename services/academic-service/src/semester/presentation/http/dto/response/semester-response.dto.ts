import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { PaginationMeta } from '../../../../../shared/domain/interfaces/repository.interface.js'
import { SemesterWithDetails } from '../../../../domain/entities/semester.entity.js'

export class SemesterResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440009' })
  id!: string

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440008' })
  academicYearId!: string

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440010' })
  typeId!: string

  @ApiProperty({
    example: { id: '550e8400-e29b-41d4-a716-446655440010', name: 'ODD' },
  })
  type!: { id: string; name: string }

  @ApiProperty({ example: false })
  isActive!: boolean

  @ApiProperty({
    example: { id: '550e8400-e29b-41d4-a716-446655440009', name: '2024/2025' },
  })
  academicYear!: { id: string; name: string }

  @ApiPropertyOptional({
    example: '2025-07-14T00:00:00.000Z',
    nullable: true,
  })
  startDate?: Date | null

  @ApiPropertyOptional({
    example: '2025-12-20T00:00:00.000Z',
    nullable: true,
  })
  endDate?: Date | null

  static fromDomain(entity: SemesterWithDetails): SemesterResponseDto {
    const dto = new SemesterResponseDto()
    dto.id = entity.id
    dto.academicYearId = entity.academicYearId
    dto.typeId = entity.typeId
    dto.type = entity.type
    dto.isActive = entity.isActive
    dto.academicYear = entity.academicYear
    dto.startDate = entity.startDate
    dto.endDate = entity.endDate
    return dto
  }
}

export class SemesterListResponseDto {
  @ApiProperty({ type: () => [SemesterResponseDto] })
  data!: SemesterResponseDto[]

  @ApiProperty({ example: { page: 1, limit: 10, total: 5, totalPages: 1 } })
  meta!: PaginationMeta
}
