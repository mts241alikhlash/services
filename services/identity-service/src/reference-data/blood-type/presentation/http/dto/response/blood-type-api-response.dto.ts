import type { GetBloodTypesUseCase } from '../../../../application/use-cases/get-blood-types/get-blood-types.use-case.js'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { BloodTypeEntity } from '../../../../domain/entities/blood-type.entity.js'

export class BloodTypeItemResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  static fromDomain(domain: BloodTypeEntity): BloodTypeItemResponseDto {
    const dto = new BloodTypeItemResponseDto()
    dto.id = domain.id
    dto.name = domain.name
    dto.isActive = domain.isActive
    return dto
  }
}

export class BloodTypePageItemResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  static fromDomain(domain: BloodTypeEntity): BloodTypePageItemResponseDto {
    const dto = new BloodTypePageItemResponseDto()
    dto.id = domain.id
    dto.name = domain.name
    dto.isActive = domain.isActive
    return dto
  }
}

export class BloodTypePageResponseMetaDto {
  @ApiProperty({ type: Number })
  page!: number

  @ApiProperty({ type: Number })
  limit!: number

  @ApiProperty({ type: Number })
  total!: number

  @ApiProperty({ type: Number })
  totalPages!: number

  static fromDomain(
    domain: Awaited<ReturnType<GetBloodTypesUseCase['execute']>>['meta'],
  ): BloodTypePageResponseMetaDto {
    const dto = new BloodTypePageResponseMetaDto()
    dto.page = domain.page
    dto.limit = domain.limit
    dto.total = domain.total
    dto.totalPages = domain.totalPages
    return dto
  }
}

export class BloodTypePageResponseDto {
  @ApiProperty({ type: () => [BloodTypePageItemResponseDto] })
  data!: BloodTypePageItemResponseDto[]

  @ApiProperty({ type: () => BloodTypePageResponseMetaDto })
  meta!: BloodTypePageResponseMetaDto

  static fromDomain(
    domain: Awaited<ReturnType<GetBloodTypesUseCase['execute']>>,
  ): BloodTypePageResponseDto {
    const dto = new BloodTypePageResponseDto()
    dto.data = domain.data.map((item) =>
      BloodTypePageItemResponseDto.fromDomain(item),
    )
    dto.meta = BloodTypePageResponseMetaDto.fromDomain(domain.meta)
    return dto
  }
}
