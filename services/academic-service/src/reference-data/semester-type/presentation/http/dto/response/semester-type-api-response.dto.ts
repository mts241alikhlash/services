import type { GetSemesterTypesUseCase } from '../../../../application/use-cases/get-semester-types/get-semester-types.use-case.js'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { SemesterTypeEntity } from '../../../../domain/entities/semester-type.entity.js'

export class SemesterTypeItemResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Number })
  sequence!: number

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  static fromDomain(domain: SemesterTypeEntity): SemesterTypeItemResponseDto {
    const dto = new SemesterTypeItemResponseDto()
    dto.id = domain.id
    dto.name = domain.name
    dto.sequence = domain.sequence
    dto.isActive = domain.isActive
    return dto
  }
}

export class SemesterTypePageItemResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Number })
  sequence!: number

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  static fromDomain(
    domain: SemesterTypeEntity,
  ): SemesterTypePageItemResponseDto {
    const dto = new SemesterTypePageItemResponseDto()
    dto.id = domain.id
    dto.name = domain.name
    dto.sequence = domain.sequence
    dto.isActive = domain.isActive
    return dto
  }
}

export class SemesterTypePageResponseMetaDto {
  @ApiProperty({ type: Number })
  page!: number

  @ApiProperty({ type: Number })
  limit!: number

  @ApiProperty({ type: Number })
  total!: number

  @ApiProperty({ type: Number })
  totalPages!: number

  static fromDomain(
    domain: Awaited<ReturnType<GetSemesterTypesUseCase['execute']>>['meta'],
  ): SemesterTypePageResponseMetaDto {
    const dto = new SemesterTypePageResponseMetaDto()
    dto.page = domain.page
    dto.limit = domain.limit
    dto.total = domain.total
    dto.totalPages = domain.totalPages
    return dto
  }
}

export class SemesterTypePageResponseDto {
  @ApiProperty({ type: () => [SemesterTypePageItemResponseDto] })
  data!: SemesterTypePageItemResponseDto[]

  @ApiProperty({ type: () => SemesterTypePageResponseMetaDto })
  meta!: SemesterTypePageResponseMetaDto

  static fromDomain(
    domain: Awaited<ReturnType<GetSemesterTypesUseCase['execute']>>,
  ): SemesterTypePageResponseDto {
    const dto = new SemesterTypePageResponseDto()
    dto.data = domain.data.map((item) =>
      SemesterTypePageItemResponseDto.fromDomain(item),
    )
    dto.meta = SemesterTypePageResponseMetaDto.fromDomain(domain.meta)
    return dto
  }
}
