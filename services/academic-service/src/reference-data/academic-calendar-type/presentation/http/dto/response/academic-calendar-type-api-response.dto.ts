import type { GetAcademicCalendarTypesUseCase } from '../../../../application/use-cases/get-academic-calendar-types/get-academic-calendar-types.use-case.js'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { AcademicCalendarTypeEntity } from '../../../../domain/entities/academic-calendar-type.entity.js'

export class AcademicCalendarTypeItemResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  static fromDomain(
    domain: AcademicCalendarTypeEntity,
  ): AcademicCalendarTypeItemResponseDto {
    const dto = new AcademicCalendarTypeItemResponseDto()
    dto.id = domain.id
    dto.name = domain.name
    dto.isActive = domain.isActive
    return dto
  }
}

export class AcademicCalendarTypePageItemResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  static fromDomain(
    domain: AcademicCalendarTypeEntity,
  ): AcademicCalendarTypePageItemResponseDto {
    const dto = new AcademicCalendarTypePageItemResponseDto()
    dto.id = domain.id
    dto.name = domain.name
    dto.isActive = domain.isActive
    return dto
  }
}

export class AcademicCalendarTypePageResponseMetaDto {
  @ApiProperty({ type: Number })
  page!: number

  @ApiProperty({ type: Number })
  limit!: number

  @ApiProperty({ type: Number })
  total!: number

  @ApiProperty({ type: Number })
  totalPages!: number

  static fromDomain(
    domain: Awaited<
      ReturnType<GetAcademicCalendarTypesUseCase['execute']>
    >['meta'],
  ): AcademicCalendarTypePageResponseMetaDto {
    const dto = new AcademicCalendarTypePageResponseMetaDto()
    dto.page = domain.page
    dto.limit = domain.limit
    dto.total = domain.total
    dto.totalPages = domain.totalPages
    return dto
  }
}

export class AcademicCalendarTypePageResponseDto {
  @ApiProperty({ type: () => [AcademicCalendarTypePageItemResponseDto] })
  data!: AcademicCalendarTypePageItemResponseDto[]

  @ApiProperty({ type: () => AcademicCalendarTypePageResponseMetaDto })
  meta!: AcademicCalendarTypePageResponseMetaDto

  static fromDomain(
    domain: Awaited<ReturnType<GetAcademicCalendarTypesUseCase['execute']>>,
  ): AcademicCalendarTypePageResponseDto {
    const dto = new AcademicCalendarTypePageResponseDto()
    dto.data = domain.data.map((item) =>
      AcademicCalendarTypePageItemResponseDto.fromDomain(item),
    )
    dto.meta = AcademicCalendarTypePageResponseMetaDto.fromDomain(domain.meta)
    return dto
  }
}
