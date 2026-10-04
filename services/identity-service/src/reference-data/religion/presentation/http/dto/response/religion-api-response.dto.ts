import type { GetReligionsUseCase } from '../../../../application/use-cases/get-religions/get-religions.use-case.js'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { ReligionEntity } from '../../../../domain/entities/religion.entity.js'

export class ReligionItemResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  static fromDomain(domain: ReligionEntity): ReligionItemResponseDto {
    const dto = new ReligionItemResponseDto()
    dto.id = domain.id
    dto.name = domain.name
    dto.isActive = domain.isActive
    return dto
  }
}

export class ReligionPageItemResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  static fromDomain(domain: ReligionEntity): ReligionPageItemResponseDto {
    const dto = new ReligionPageItemResponseDto()
    dto.id = domain.id
    dto.name = domain.name
    dto.isActive = domain.isActive
    return dto
  }
}

export class ReligionPageResponseMetaDto {
  @ApiProperty({ type: Number })
  page!: number

  @ApiProperty({ type: Number })
  limit!: number

  @ApiProperty({ type: Number })
  total!: number

  @ApiProperty({ type: Number })
  totalPages!: number

  static fromDomain(
    domain: Awaited<ReturnType<GetReligionsUseCase['execute']>>['meta'],
  ): ReligionPageResponseMetaDto {
    const dto = new ReligionPageResponseMetaDto()
    dto.page = domain.page
    dto.limit = domain.limit
    dto.total = domain.total
    dto.totalPages = domain.totalPages
    return dto
  }
}

export class ReligionPageResponseDto {
  @ApiProperty({ type: () => [ReligionPageItemResponseDto] })
  data!: ReligionPageItemResponseDto[]

  @ApiProperty({ type: () => ReligionPageResponseMetaDto })
  meta!: ReligionPageResponseMetaDto

  static fromDomain(
    domain: Awaited<ReturnType<GetReligionsUseCase['execute']>>,
  ): ReligionPageResponseDto {
    const dto = new ReligionPageResponseDto()
    dto.data = domain.data.map((item) =>
      ReligionPageItemResponseDto.fromDomain(item),
    )
    dto.meta = ReligionPageResponseMetaDto.fromDomain(domain.meta)
    return dto
  }
}
