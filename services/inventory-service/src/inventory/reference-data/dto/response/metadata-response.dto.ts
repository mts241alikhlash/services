import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { GetMetadataUseCase } from '../../use-cases/get-metadata.use-case.js'

export class InventoryMetadataResponseCategoriesDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: String, nullable: true })
  parentId!: string | null

  @ApiProperty({ type: String })
  depreciationRatePercent!: string

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        Awaited<ReturnType<GetMetadataUseCase['execute']>>['categories']
      >[number]
    >,
  ): InventoryMetadataResponseCategoriesDto {
    const dto = new InventoryMetadataResponseCategoriesDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    dto.parentId = domain.parentId
    dto.depreciationRatePercent = domain.depreciationRatePercent
    dto.createdAt = domain.createdAt.toISOString()
    return dto
  }
}

export class InventoryMetadataResponseLocationsDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: String, nullable: true })
  building!: string | null

  @ApiProperty({ type: String, nullable: true })
  room!: string | null

  @ApiProperty({ type: String, nullable: true })
  rack!: string | null

  @ApiProperty({ type: String, nullable: true })
  description!: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        Awaited<ReturnType<GetMetadataUseCase['execute']>>['locations']
      >[number]
    >,
  ): InventoryMetadataResponseLocationsDto {
    const dto = new InventoryMetadataResponseLocationsDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    dto.building = domain.building
    dto.room = domain.room
    dto.rack = domain.rack
    dto.description = domain.description
    dto.createdAt = domain.createdAt.toISOString()
    return dto
  }
}

export class InventoryMetadataResponseConditionsDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  isUsable!: boolean

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        Awaited<ReturnType<GetMetadataUseCase['execute']>>['conditions']
      >[number]
    >,
  ): InventoryMetadataResponseConditionsDto {
    const dto = new InventoryMetadataResponseConditionsDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    dto.isUsable = domain.isUsable
    dto.createdAt = domain.createdAt.toISOString()
    return dto
  }
}

export class InventoryMetadataResponseStatusesDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  allowTransactions!: boolean

  @ApiProperty({
    enum: [
      'AVAILABLE',
      'LOANED',
      'LOAN_PENDING',
      'LOAN_APPROVED',
      'LOAN_REJECTED',
      'LOAN_RETURNED',
    ],
    nullable: true,
  })
  systemKey!:
    | 'AVAILABLE'
    | 'LOANED'
    | 'LOAN_PENDING'
    | 'LOAN_APPROVED'
    | 'LOAN_REJECTED'
    | 'LOAN_RETURNED'
    | null

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        Awaited<ReturnType<GetMetadataUseCase['execute']>>['statuses']
      >[number]
    >,
  ): InventoryMetadataResponseStatusesDto {
    const dto = new InventoryMetadataResponseStatusesDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    dto.allowTransactions = domain.allowTransactions
    dto.systemKey = domain.systemKey
    dto.createdAt = domain.createdAt.toISOString()
    return dto
  }
}

export class InventoryMetadataResponseFundingSourcesDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: String, nullable: true })
  description!: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        Awaited<ReturnType<GetMetadataUseCase['execute']>>['fundingSources']
      >[number]
    >,
  ): InventoryMetadataResponseFundingSourcesDto {
    const dto = new InventoryMetadataResponseFundingSourcesDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    dto.description = domain.description
    dto.createdAt = domain.createdAt.toISOString()
    return dto
  }
}

export class InventoryMetadataResponseDto {
  @ApiProperty({
    type: () => InventoryMetadataResponseCategoriesDto,
    isArray: true,
  })
  categories!: InventoryMetadataResponseCategoriesDto[]

  @ApiProperty({
    type: () => InventoryMetadataResponseLocationsDto,
    isArray: true,
  })
  locations!: InventoryMetadataResponseLocationsDto[]

  @ApiProperty({
    type: () => InventoryMetadataResponseConditionsDto,
    isArray: true,
  })
  conditions!: InventoryMetadataResponseConditionsDto[]

  @ApiProperty({
    type: () => InventoryMetadataResponseStatusesDto,
    isArray: true,
  })
  statuses!: InventoryMetadataResponseStatusesDto[]

  @ApiProperty({
    type: () => InventoryMetadataResponseFundingSourcesDto,
    isArray: true,
  })
  fundingSources!: InventoryMetadataResponseFundingSourcesDto[]

  static fromDomain(
    domain: Awaited<ReturnType<GetMetadataUseCase['execute']>>,
  ): InventoryMetadataResponseDto {
    const dto = new InventoryMetadataResponseDto()
    dto.categories = domain.categories.map((x) =>
      InventoryMetadataResponseCategoriesDto.fromDomain(x),
    )
    dto.locations = domain.locations.map((x) =>
      InventoryMetadataResponseLocationsDto.fromDomain(x),
    )
    dto.conditions = domain.conditions.map((x) =>
      InventoryMetadataResponseConditionsDto.fromDomain(x),
    )
    dto.statuses = domain.statuses.map((x) =>
      InventoryMetadataResponseStatusesDto.fromDomain(x),
    )
    dto.fundingSources = domain.fundingSources.map((x) =>
      InventoryMetadataResponseFundingSourcesDto.fromDomain(x),
    )
    return dto
  }
}
