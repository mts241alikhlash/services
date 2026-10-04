import type { AssetUnitRepositoryOutput } from '../../../../domain/repositories/asset-unit.repository.js'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { AssetRepositoryOutput } from '../../../../domain/repositories/asset.repository.js'

export class InventoryAssetResponseCategoryDto {
  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<AssetRepositoryOutput['category']>,
  ): InventoryAssetResponseCategoryDto {
    const dto = new InventoryAssetResponseCategoryDto()
    dto.code = domain.code
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class InventoryAssetResponseFundingSourceDto {
  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<AssetRepositoryOutput['fundingSource']>,
  ): InventoryAssetResponseFundingSourceDto {
    const dto = new InventoryAssetResponseFundingSourceDto()
    dto.code = domain.code
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class InventoryAssetResponseUnitsAssetCategoryDto {
  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          NonNullable<AssetRepositoryOutput['units']>[number]
        >['asset']
      >['category']
    >,
  ): InventoryAssetResponseUnitsAssetCategoryDto {
    const dto = new InventoryAssetResponseUnitsAssetCategoryDto()
    dto.code = domain.code
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class InventoryAssetResponseUnitsAssetDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  assetNumber!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({
    type: () => InventoryAssetResponseUnitsAssetCategoryDto,
    nullable: true,
  })
  category!: InventoryAssetResponseUnitsAssetCategoryDto | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<NonNullable<AssetRepositoryOutput['units']>[number]>['asset']
    >,
  ): InventoryAssetResponseUnitsAssetDto {
    const dto = new InventoryAssetResponseUnitsAssetDto()
    dto.id = domain.id
    dto.assetNumber = domain.assetNumber
    dto.name = domain.name
    dto.category =
      domain.category == null
        ? domain.category
        : InventoryAssetResponseUnitsAssetCategoryDto.fromDomain(
            domain.category,
          )
    return dto
  }
}

export class InventoryAssetResponseUnitsConditionDto {
  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<AssetRepositoryOutput['units']>[number]
      >['condition']
    >,
  ): InventoryAssetResponseUnitsConditionDto {
    const dto = new InventoryAssetResponseUnitsConditionDto()
    dto.code = domain.code
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class InventoryAssetResponseUnitsStatusDto {
  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<NonNullable<AssetRepositoryOutput['units']>[number]>['status']
    >,
  ): InventoryAssetResponseUnitsStatusDto {
    const dto = new InventoryAssetResponseUnitsStatusDto()
    dto.code = domain.code
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class InventoryAssetResponseUnitsLocationDto {
  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<AssetRepositoryOutput['units']>[number]
      >['location']
    >,
  ): InventoryAssetResponseUnitsLocationDto {
    const dto = new InventoryAssetResponseUnitsLocationDto()
    dto.code = domain.code
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class InventoryAssetResponseUnitsDto {
  @ApiPropertyOptional({ type: () => InventoryAssetResponseUnitsAssetDto })
  asset?: InventoryAssetResponseUnitsAssetDto

  @ApiPropertyOptional({ type: () => InventoryAssetResponseUnitsConditionDto })
  condition?: InventoryAssetResponseUnitsConditionDto

  @ApiPropertyOptional({ type: () => InventoryAssetResponseUnitsStatusDto })
  status?: InventoryAssetResponseUnitsStatusDto

  @ApiPropertyOptional({ type: () => InventoryAssetResponseUnitsLocationDto })
  location?: InventoryAssetResponseUnitsLocationDto

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  assetId!: string

  @ApiProperty({ type: String })
  unitNumber!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  barcode?: string | null

  @ApiProperty({ type: Number })
  currentBookValue!: number

  @ApiProperty({ type: String })
  conditionId!: string

  @ApiProperty({ type: String })
  statusId!: string

  @ApiProperty({ type: String })
  locationId!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  custodianId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  notes?: string | null

  @ApiPropertyOptional({ type: Number })
  version?: number

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  createdAt?: string

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  updatedAt?: string

  static fromDomain(
    domain: NonNullable<NonNullable<AssetRepositoryOutput['units']>[number]>,
  ): InventoryAssetResponseUnitsDto {
    const dto = new InventoryAssetResponseUnitsDto()
    if (domain.asset !== undefined)
      dto.asset =
        domain.asset == null
          ? domain.asset
          : InventoryAssetResponseUnitsAssetDto.fromDomain(domain.asset)
    if (domain.condition !== undefined)
      dto.condition =
        domain.condition == null
          ? domain.condition
          : InventoryAssetResponseUnitsConditionDto.fromDomain(domain.condition)
    if (domain.status !== undefined)
      dto.status =
        domain.status == null
          ? domain.status
          : InventoryAssetResponseUnitsStatusDto.fromDomain(domain.status)
    if (domain.location !== undefined)
      dto.location =
        domain.location == null
          ? domain.location
          : InventoryAssetResponseUnitsLocationDto.fromDomain(domain.location)
    dto.id = domain.id
    dto.assetId = domain.assetId
    dto.unitNumber = domain.unitNumber
    dto.barcode = domain.barcode
    dto.currentBookValue = Number(domain.currentBookValue)
    dto.conditionId = domain.conditionId
    dto.statusId = domain.statusId
    dto.locationId = domain.locationId
    dto.custodianId = domain.custodianId
    dto.notes = domain.notes
    dto.version = domain.version
    if (domain.createdAt !== undefined)
      dto.createdAt =
        domain.createdAt == null
          ? domain.createdAt
          : domain.createdAt.toISOString()
    if (domain.updatedAt !== undefined)
      dto.updatedAt =
        domain.updatedAt == null
          ? domain.updatedAt
          : domain.updatedAt.toISOString()
    return dto
  }
}

export class InventoryAssetResponseCountDto {
  @ApiPropertyOptional({ type: Number })
  units?: number

  static fromDomain(
    domain: NonNullable<AssetRepositoryOutput['_count']>,
  ): InventoryAssetResponseCountDto {
    const dto = new InventoryAssetResponseCountDto()
    dto.units = domain.units
    return dto
  }
}

export class InventoryAssetResponseDto {
  @ApiPropertyOptional({ type: () => InventoryAssetResponseCategoryDto })
  category?: InventoryAssetResponseCategoryDto

  @ApiPropertyOptional({
    type: () => InventoryAssetResponseFundingSourceDto,
    nullable: true,
  })
  fundingSource?: InventoryAssetResponseFundingSourceDto | null

  @ApiPropertyOptional({
    type: () => InventoryAssetResponseUnitsDto,
    isArray: true,
  })
  units?: InventoryAssetResponseUnitsDto[]

  @ApiPropertyOptional({ type: () => InventoryAssetResponseCountDto })
  _count?: InventoryAssetResponseCountDto

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  assetNumber!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: String })
  categoryId!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  fundingSourceId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  brand?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  model?: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  purchaseDate!: string

  @ApiProperty({ type: Number })
  purchasePrice!: number

  @ApiPropertyOptional({ type: Number, nullable: true })
  usefulLifeMonths?: number | null

  @ApiPropertyOptional({ type: String, nullable: true })
  notes?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  imageUrl?: string | null

  @ApiPropertyOptional({ type: Number })
  version?: number

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  createdAt?: string

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  updatedAt?: string

  static fromDomain(domain: AssetRepositoryOutput): InventoryAssetResponseDto {
    const dto = new InventoryAssetResponseDto()
    if (domain.category !== undefined)
      dto.category =
        domain.category == null
          ? domain.category
          : InventoryAssetResponseCategoryDto.fromDomain(domain.category)
    if (domain.fundingSource !== undefined)
      dto.fundingSource =
        domain.fundingSource == null
          ? domain.fundingSource
          : InventoryAssetResponseFundingSourceDto.fromDomain(
              domain.fundingSource,
            )
    if (domain.units !== undefined)
      dto.units =
        domain.units == null
          ? domain.units
          : domain.units.map((x) =>
              InventoryAssetResponseUnitsDto.fromDomain(x),
            )
    if (domain._count !== undefined)
      dto._count =
        domain._count == null
          ? domain._count
          : InventoryAssetResponseCountDto.fromDomain(domain._count)
    dto.id = domain.id
    dto.assetNumber = domain.assetNumber
    dto.name = domain.name
    dto.categoryId = domain.categoryId
    dto.fundingSourceId = domain.fundingSourceId
    dto.brand = domain.brand
    dto.model = domain.model
    dto.purchaseDate = domain.purchaseDate.toISOString()
    dto.purchasePrice = Number(domain.purchasePrice)
    dto.usefulLifeMonths = domain.usefulLifeMonths
    dto.notes = domain.notes
    dto.imageUrl = domain.imageUrl
    dto.version = domain.version
    if (domain.createdAt !== undefined)
      dto.createdAt =
        domain.createdAt == null
          ? domain.createdAt
          : domain.createdAt.toISOString()
    if (domain.updatedAt !== undefined)
      dto.updatedAt =
        domain.updatedAt == null
          ? domain.updatedAt
          : domain.updatedAt.toISOString()
    return dto
  }
}

export class InventoryAssetListItemResponseCategoryDto {
  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<AssetRepositoryOutput['category']>,
  ): InventoryAssetListItemResponseCategoryDto {
    const dto = new InventoryAssetListItemResponseCategoryDto()
    dto.code = domain.code
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class InventoryAssetListItemResponseFundingSourceDto {
  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<AssetRepositoryOutput['fundingSource']>,
  ): InventoryAssetListItemResponseFundingSourceDto {
    const dto = new InventoryAssetListItemResponseFundingSourceDto()
    dto.code = domain.code
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class InventoryAssetListItemResponseUnitsAssetCategoryDto {
  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<
          NonNullable<AssetRepositoryOutput['units']>[number]
        >['asset']
      >['category']
    >,
  ): InventoryAssetListItemResponseUnitsAssetCategoryDto {
    const dto = new InventoryAssetListItemResponseUnitsAssetCategoryDto()
    dto.code = domain.code
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class InventoryAssetListItemResponseUnitsAssetDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  assetNumber!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({
    type: () => InventoryAssetListItemResponseUnitsAssetCategoryDto,
    nullable: true,
  })
  category!: InventoryAssetListItemResponseUnitsAssetCategoryDto | null

  static fromDomain(
    domain: NonNullable<
      NonNullable<NonNullable<AssetRepositoryOutput['units']>[number]>['asset']
    >,
  ): InventoryAssetListItemResponseUnitsAssetDto {
    const dto = new InventoryAssetListItemResponseUnitsAssetDto()
    dto.id = domain.id
    dto.assetNumber = domain.assetNumber
    dto.name = domain.name
    dto.category =
      domain.category == null
        ? domain.category
        : InventoryAssetListItemResponseUnitsAssetCategoryDto.fromDomain(
            domain.category,
          )
    return dto
  }
}

export class InventoryAssetListItemResponseUnitsConditionDto {
  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<AssetRepositoryOutput['units']>[number]
      >['condition']
    >,
  ): InventoryAssetListItemResponseUnitsConditionDto {
    const dto = new InventoryAssetListItemResponseUnitsConditionDto()
    dto.code = domain.code
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class InventoryAssetListItemResponseUnitsStatusDto {
  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<NonNullable<AssetRepositoryOutput['units']>[number]>['status']
    >,
  ): InventoryAssetListItemResponseUnitsStatusDto {
    const dto = new InventoryAssetListItemResponseUnitsStatusDto()
    dto.code = domain.code
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class InventoryAssetListItemResponseUnitsLocationDto {
  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<AssetRepositoryOutput['units']>[number]
      >['location']
    >,
  ): InventoryAssetListItemResponseUnitsLocationDto {
    const dto = new InventoryAssetListItemResponseUnitsLocationDto()
    dto.code = domain.code
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class InventoryAssetListItemResponseUnitsDto {
  @ApiPropertyOptional({
    type: () => InventoryAssetListItemResponseUnitsAssetDto,
  })
  asset?: InventoryAssetListItemResponseUnitsAssetDto

  @ApiPropertyOptional({
    type: () => InventoryAssetListItemResponseUnitsConditionDto,
  })
  condition?: InventoryAssetListItemResponseUnitsConditionDto

  @ApiPropertyOptional({
    type: () => InventoryAssetListItemResponseUnitsStatusDto,
  })
  status?: InventoryAssetListItemResponseUnitsStatusDto

  @ApiPropertyOptional({
    type: () => InventoryAssetListItemResponseUnitsLocationDto,
  })
  location?: InventoryAssetListItemResponseUnitsLocationDto

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  assetId!: string

  @ApiProperty({ type: String })
  unitNumber!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  barcode?: string | null

  @ApiProperty({ type: Number })
  currentBookValue!: number

  @ApiProperty({ type: String })
  conditionId!: string

  @ApiProperty({ type: String })
  statusId!: string

  @ApiProperty({ type: String })
  locationId!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  custodianId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  notes?: string | null

  @ApiPropertyOptional({ type: Number })
  version?: number

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  createdAt?: string

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  updatedAt?: string

  static fromDomain(
    domain: NonNullable<NonNullable<AssetRepositoryOutput['units']>[number]>,
  ): InventoryAssetListItemResponseUnitsDto {
    const dto = new InventoryAssetListItemResponseUnitsDto()
    if (domain.asset !== undefined)
      dto.asset =
        domain.asset == null
          ? domain.asset
          : InventoryAssetListItemResponseUnitsAssetDto.fromDomain(domain.asset)
    if (domain.condition !== undefined)
      dto.condition =
        domain.condition == null
          ? domain.condition
          : InventoryAssetListItemResponseUnitsConditionDto.fromDomain(
              domain.condition,
            )
    if (domain.status !== undefined)
      dto.status =
        domain.status == null
          ? domain.status
          : InventoryAssetListItemResponseUnitsStatusDto.fromDomain(
              domain.status,
            )
    if (domain.location !== undefined)
      dto.location =
        domain.location == null
          ? domain.location
          : InventoryAssetListItemResponseUnitsLocationDto.fromDomain(
              domain.location,
            )
    dto.id = domain.id
    dto.assetId = domain.assetId
    dto.unitNumber = domain.unitNumber
    dto.barcode = domain.barcode
    dto.currentBookValue = Number(domain.currentBookValue)
    dto.conditionId = domain.conditionId
    dto.statusId = domain.statusId
    dto.locationId = domain.locationId
    dto.custodianId = domain.custodianId
    dto.notes = domain.notes
    dto.version = domain.version
    if (domain.createdAt !== undefined)
      dto.createdAt =
        domain.createdAt == null
          ? domain.createdAt
          : domain.createdAt.toISOString()
    if (domain.updatedAt !== undefined)
      dto.updatedAt =
        domain.updatedAt == null
          ? domain.updatedAt
          : domain.updatedAt.toISOString()
    return dto
  }
}

export class InventoryAssetListItemResponseCountDto {
  @ApiPropertyOptional({ type: Number })
  units?: number

  static fromDomain(
    domain: NonNullable<AssetRepositoryOutput['_count']>,
  ): InventoryAssetListItemResponseCountDto {
    const dto = new InventoryAssetListItemResponseCountDto()
    dto.units = domain.units
    return dto
  }
}

export class InventoryAssetListItemResponseDto {
  @ApiPropertyOptional({
    type: () => InventoryAssetListItemResponseCategoryDto,
  })
  category?: InventoryAssetListItemResponseCategoryDto

  @ApiPropertyOptional({
    type: () => InventoryAssetListItemResponseFundingSourceDto,
    nullable: true,
  })
  fundingSource?: InventoryAssetListItemResponseFundingSourceDto | null

  @ApiPropertyOptional({
    type: () => InventoryAssetListItemResponseUnitsDto,
    isArray: true,
  })
  units?: InventoryAssetListItemResponseUnitsDto[]

  @ApiPropertyOptional({ type: () => InventoryAssetListItemResponseCountDto })
  _count?: InventoryAssetListItemResponseCountDto

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  assetNumber!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: String })
  categoryId!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  fundingSourceId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  brand?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  model?: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  purchaseDate!: string

  @ApiProperty({ type: Number })
  purchasePrice!: number

  @ApiPropertyOptional({ type: Number, nullable: true })
  usefulLifeMonths?: number | null

  @ApiPropertyOptional({ type: String, nullable: true })
  notes?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  imageUrl?: string | null

  @ApiPropertyOptional({ type: Number })
  version?: number

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  createdAt?: string

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  updatedAt?: string

  static fromDomain(
    domain: AssetRepositoryOutput,
  ): InventoryAssetListItemResponseDto {
    const dto = new InventoryAssetListItemResponseDto()
    if (domain.category !== undefined)
      dto.category =
        domain.category == null
          ? domain.category
          : InventoryAssetListItemResponseCategoryDto.fromDomain(
              domain.category,
            )
    if (domain.fundingSource !== undefined)
      dto.fundingSource =
        domain.fundingSource == null
          ? domain.fundingSource
          : InventoryAssetListItemResponseFundingSourceDto.fromDomain(
              domain.fundingSource,
            )
    if (domain.units !== undefined)
      dto.units =
        domain.units == null
          ? domain.units
          : domain.units.map((x) =>
              InventoryAssetListItemResponseUnitsDto.fromDomain(x),
            )
    if (domain._count !== undefined)
      dto._count =
        domain._count == null
          ? domain._count
          : InventoryAssetListItemResponseCountDto.fromDomain(domain._count)
    dto.id = domain.id
    dto.assetNumber = domain.assetNumber
    dto.name = domain.name
    dto.categoryId = domain.categoryId
    dto.fundingSourceId = domain.fundingSourceId
    dto.brand = domain.brand
    dto.model = domain.model
    dto.purchaseDate = domain.purchaseDate.toISOString()
    dto.purchasePrice = Number(domain.purchasePrice)
    dto.usefulLifeMonths = domain.usefulLifeMonths
    dto.notes = domain.notes
    dto.imageUrl = domain.imageUrl
    dto.version = domain.version
    if (domain.createdAt !== undefined)
      dto.createdAt =
        domain.createdAt == null
          ? domain.createdAt
          : domain.createdAt.toISOString()
    if (domain.updatedAt !== undefined)
      dto.updatedAt =
        domain.updatedAt == null
          ? domain.updatedAt
          : domain.updatedAt.toISOString()
    return dto
  }
}

export class InventoryAssetListResponseDto {
  @ApiProperty({ type: () => [InventoryAssetListItemResponseDto] })
  data!: InventoryAssetListItemResponseDto[]

  @ApiProperty({ type: Number })
  total!: number

  @ApiProperty({ type: Number })
  page!: number

  @ApiProperty({ type: Number })
  limit!: number

  static fromDomain(domain: {
    data: AssetRepositoryOutput[]
    total: number
    page: number
    limit: number
  }): InventoryAssetListResponseDto {
    const dto = new InventoryAssetListResponseDto()
    dto.data = domain.data.map((item) =>
      InventoryAssetListItemResponseDto.fromDomain(item),
    )
    dto.total = domain.total
    dto.page = domain.page
    dto.limit = domain.limit
    return dto
  }
}

export class InventoryAssetUnitResponseAssetCategoryDto {
  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<AssetUnitRepositoryOutput['asset']>['category']
    >,
  ): InventoryAssetUnitResponseAssetCategoryDto {
    const dto = new InventoryAssetUnitResponseAssetCategoryDto()
    dto.code = domain.code
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class InventoryAssetUnitResponseAssetDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  assetNumber!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({
    type: () => InventoryAssetUnitResponseAssetCategoryDto,
    nullable: true,
  })
  category!: InventoryAssetUnitResponseAssetCategoryDto | null

  static fromDomain(
    domain: NonNullable<AssetUnitRepositoryOutput['asset']>,
  ): InventoryAssetUnitResponseAssetDto {
    const dto = new InventoryAssetUnitResponseAssetDto()
    dto.id = domain.id
    dto.assetNumber = domain.assetNumber
    dto.name = domain.name
    dto.category =
      domain.category == null
        ? domain.category
        : InventoryAssetUnitResponseAssetCategoryDto.fromDomain(domain.category)
    return dto
  }
}

export class InventoryAssetUnitResponseConditionDto {
  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<AssetUnitRepositoryOutput['condition']>,
  ): InventoryAssetUnitResponseConditionDto {
    const dto = new InventoryAssetUnitResponseConditionDto()
    dto.code = domain.code
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class InventoryAssetUnitResponseStatusDto {
  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<AssetUnitRepositoryOutput['status']>,
  ): InventoryAssetUnitResponseStatusDto {
    const dto = new InventoryAssetUnitResponseStatusDto()
    dto.code = domain.code
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class InventoryAssetUnitResponseLocationDto {
  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<AssetUnitRepositoryOutput['location']>,
  ): InventoryAssetUnitResponseLocationDto {
    const dto = new InventoryAssetUnitResponseLocationDto()
    dto.code = domain.code
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class InventoryAssetUnitResponseDto {
  @ApiPropertyOptional({ type: () => InventoryAssetUnitResponseAssetDto })
  asset?: InventoryAssetUnitResponseAssetDto

  @ApiPropertyOptional({ type: () => InventoryAssetUnitResponseConditionDto })
  condition?: InventoryAssetUnitResponseConditionDto

  @ApiPropertyOptional({ type: () => InventoryAssetUnitResponseStatusDto })
  status?: InventoryAssetUnitResponseStatusDto

  @ApiPropertyOptional({ type: () => InventoryAssetUnitResponseLocationDto })
  location?: InventoryAssetUnitResponseLocationDto

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  assetId!: string

  @ApiProperty({ type: String })
  unitNumber!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  barcode?: string | null

  @ApiProperty({ type: Number })
  currentBookValue!: number

  @ApiProperty({ type: String })
  conditionId!: string

  @ApiProperty({ type: String })
  statusId!: string

  @ApiProperty({ type: String })
  locationId!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  custodianId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  notes?: string | null

  @ApiPropertyOptional({ type: Number })
  version?: number

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  createdAt?: string

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  updatedAt?: string

  static fromDomain(
    domain: AssetUnitRepositoryOutput,
  ): InventoryAssetUnitResponseDto {
    const dto = new InventoryAssetUnitResponseDto()
    if (domain.asset !== undefined)
      dto.asset =
        domain.asset == null
          ? domain.asset
          : InventoryAssetUnitResponseAssetDto.fromDomain(domain.asset)
    if (domain.condition !== undefined)
      dto.condition =
        domain.condition == null
          ? domain.condition
          : InventoryAssetUnitResponseConditionDto.fromDomain(domain.condition)
    if (domain.status !== undefined)
      dto.status =
        domain.status == null
          ? domain.status
          : InventoryAssetUnitResponseStatusDto.fromDomain(domain.status)
    if (domain.location !== undefined)
      dto.location =
        domain.location == null
          ? domain.location
          : InventoryAssetUnitResponseLocationDto.fromDomain(domain.location)
    dto.id = domain.id
    dto.assetId = domain.assetId
    dto.unitNumber = domain.unitNumber
    dto.barcode = domain.barcode
    dto.currentBookValue = Number(domain.currentBookValue)
    dto.conditionId = domain.conditionId
    dto.statusId = domain.statusId
    dto.locationId = domain.locationId
    dto.custodianId = domain.custodianId
    dto.notes = domain.notes
    dto.version = domain.version
    if (domain.createdAt !== undefined)
      dto.createdAt =
        domain.createdAt == null
          ? domain.createdAt
          : domain.createdAt.toISOString()
    if (domain.updatedAt !== undefined)
      dto.updatedAt =
        domain.updatedAt == null
          ? domain.updatedAt
          : domain.updatedAt.toISOString()
    return dto
  }
}

export class InventoryAssetUnitListItemResponseAssetCategoryDto {
  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<AssetUnitRepositoryOutput['asset']>['category']
    >,
  ): InventoryAssetUnitListItemResponseAssetCategoryDto {
    const dto = new InventoryAssetUnitListItemResponseAssetCategoryDto()
    dto.code = domain.code
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class InventoryAssetUnitListItemResponseAssetDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  assetNumber!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({
    type: () => InventoryAssetUnitListItemResponseAssetCategoryDto,
    nullable: true,
  })
  category!: InventoryAssetUnitListItemResponseAssetCategoryDto | null

  static fromDomain(
    domain: NonNullable<AssetUnitRepositoryOutput['asset']>,
  ): InventoryAssetUnitListItemResponseAssetDto {
    const dto = new InventoryAssetUnitListItemResponseAssetDto()
    dto.id = domain.id
    dto.assetNumber = domain.assetNumber
    dto.name = domain.name
    dto.category =
      domain.category == null
        ? domain.category
        : InventoryAssetUnitListItemResponseAssetCategoryDto.fromDomain(
            domain.category,
          )
    return dto
  }
}

export class InventoryAssetUnitListItemResponseConditionDto {
  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<AssetUnitRepositoryOutput['condition']>,
  ): InventoryAssetUnitListItemResponseConditionDto {
    const dto = new InventoryAssetUnitListItemResponseConditionDto()
    dto.code = domain.code
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class InventoryAssetUnitListItemResponseStatusDto {
  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<AssetUnitRepositoryOutput['status']>,
  ): InventoryAssetUnitListItemResponseStatusDto {
    const dto = new InventoryAssetUnitListItemResponseStatusDto()
    dto.code = domain.code
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class InventoryAssetUnitListItemResponseLocationDto {
  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string

  static fromDomain(
    domain: NonNullable<AssetUnitRepositoryOutput['location']>,
  ): InventoryAssetUnitListItemResponseLocationDto {
    const dto = new InventoryAssetUnitListItemResponseLocationDto()
    dto.code = domain.code
    dto.id = domain.id
    dto.name = domain.name
    return dto
  }
}

export class InventoryAssetUnitListItemResponseDto {
  @ApiPropertyOptional({
    type: () => InventoryAssetUnitListItemResponseAssetDto,
  })
  asset?: InventoryAssetUnitListItemResponseAssetDto

  @ApiPropertyOptional({
    type: () => InventoryAssetUnitListItemResponseConditionDto,
  })
  condition?: InventoryAssetUnitListItemResponseConditionDto

  @ApiPropertyOptional({
    type: () => InventoryAssetUnitListItemResponseStatusDto,
  })
  status?: InventoryAssetUnitListItemResponseStatusDto

  @ApiPropertyOptional({
    type: () => InventoryAssetUnitListItemResponseLocationDto,
  })
  location?: InventoryAssetUnitListItemResponseLocationDto

  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  assetId!: string

  @ApiProperty({ type: String })
  unitNumber!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  barcode?: string | null

  @ApiProperty({ type: Number })
  currentBookValue!: number

  @ApiProperty({ type: String })
  conditionId!: string

  @ApiProperty({ type: String })
  statusId!: string

  @ApiProperty({ type: String })
  locationId!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  custodianId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  notes?: string | null

  @ApiPropertyOptional({ type: Number })
  version?: number

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  createdAt?: string

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  updatedAt?: string

  static fromDomain(
    domain: AssetUnitRepositoryOutput,
  ): InventoryAssetUnitListItemResponseDto {
    const dto = new InventoryAssetUnitListItemResponseDto()
    if (domain.asset !== undefined)
      dto.asset =
        domain.asset == null
          ? domain.asset
          : InventoryAssetUnitListItemResponseAssetDto.fromDomain(domain.asset)
    if (domain.condition !== undefined)
      dto.condition =
        domain.condition == null
          ? domain.condition
          : InventoryAssetUnitListItemResponseConditionDto.fromDomain(
              domain.condition,
            )
    if (domain.status !== undefined)
      dto.status =
        domain.status == null
          ? domain.status
          : InventoryAssetUnitListItemResponseStatusDto.fromDomain(
              domain.status,
            )
    if (domain.location !== undefined)
      dto.location =
        domain.location == null
          ? domain.location
          : InventoryAssetUnitListItemResponseLocationDto.fromDomain(
              domain.location,
            )
    dto.id = domain.id
    dto.assetId = domain.assetId
    dto.unitNumber = domain.unitNumber
    dto.barcode = domain.barcode
    dto.currentBookValue = Number(domain.currentBookValue)
    dto.conditionId = domain.conditionId
    dto.statusId = domain.statusId
    dto.locationId = domain.locationId
    dto.custodianId = domain.custodianId
    dto.notes = domain.notes
    dto.version = domain.version
    if (domain.createdAt !== undefined)
      dto.createdAt =
        domain.createdAt == null
          ? domain.createdAt
          : domain.createdAt.toISOString()
    if (domain.updatedAt !== undefined)
      dto.updatedAt =
        domain.updatedAt == null
          ? domain.updatedAt
          : domain.updatedAt.toISOString()
    return dto
  }
}

export class InventoryAssetUnitListResponseDto {
  @ApiProperty({ type: () => [InventoryAssetUnitListItemResponseDto] })
  data!: InventoryAssetUnitListItemResponseDto[]

  @ApiProperty({ type: Number })
  total!: number

  @ApiProperty({ type: Number })
  page!: number

  @ApiProperty({ type: Number })
  limit!: number

  static fromDomain(domain: {
    data: AssetUnitRepositoryOutput[]
    total: number
    page: number
    limit: number
  }): InventoryAssetUnitListResponseDto {
    const dto = new InventoryAssetUnitListResponseDto()
    dto.data = domain.data.map((item) =>
      InventoryAssetUnitListItemResponseDto.fromDomain(item),
    )
    dto.total = domain.total
    dto.page = domain.page
    dto.limit = domain.limit
    return dto
  }
}
