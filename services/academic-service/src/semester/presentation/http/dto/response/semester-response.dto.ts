import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { PaginationMeta } from '../../../../../shared/domain/interfaces/repository.interface.js'
import { SemesterWithDetails } from '../../../../domain/entities/semester.entity.js'

export class SemesterAcademicYearDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string
}

export class SemesterTypeRefDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440010' })
  id!: string

  @ApiProperty({ example: 'ODD' })
  name!: string

  @ApiProperty({ example: 1 })
  sequence!: number
}

export class SemesterCountDto {
  @ApiProperty({ example: 120 })
  enrollments!: number

  @ApiProperty({ example: 14 })
  teachingAssignments!: number
}

export class SemesterResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440009' })
  id!: string

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440008' })
  academicYearId!: string

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440010' })
  typeId!: string

  @ApiProperty({ type: () => SemesterTypeRefDto })
  type!: SemesterTypeRefDto

  @ApiProperty({ example: false })
  isActive!: boolean

  @ApiProperty({
    example: { id: '550e8400-e29b-41d4-a716-446655440009', name: '2024/2025' },
    type: () => SemesterAcademicYearDto,
  })
  academicYear!: SemesterAcademicYearDto

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

  @ApiPropertyOptional({ type: () => SemesterCountDto })
  _count?: SemesterCountDto

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
    if (entity._count) {
      dto._count = {
        enrollments: entity._count.enrollments,
        teachingAssignments: entity._count.teachingAssignments,
      }
    }
    return dto
  }
}

export class SemesterListResponseDto {
  @ApiProperty({ type: () => [SemesterResponseDto] })
  data!: SemesterResponseDto[]

  @ApiProperty({ example: { page: 1, limit: 10, total: 5, totalPages: 1 } })
  meta!: PaginationMeta
}
