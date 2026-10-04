import type { HistoryRepositoryOutput } from '../../../../domain/repositories/history.repository.js'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { LoanRepositoryOutput } from '../../../../domain/repositories/loan.repository.js'

export class InventoryLoanResponseStatusDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  systemKey?: string | null

  @ApiProperty({ type: Boolean })
  allowTransactions!: boolean

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  createdAt?: string

  static fromDomain(
    domain: NonNullable<LoanRepositoryOutput['status']>,
  ): InventoryLoanResponseStatusDto {
    const dto = new InventoryLoanResponseStatusDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    dto.systemKey = domain.systemKey
    dto.allowTransactions = domain.allowTransactions
    if (domain.createdAt !== undefined)
      dto.createdAt =
        domain.createdAt == null
          ? domain.createdAt
          : domain.createdAt.toISOString()
    return dto
  }
}

export class InventoryLoanResponseItemsUnitAssetDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  assetNumber!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: String })
  categoryId!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  brand?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  model?: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  purchaseDate!: string

  @ApiProperty({ type: Number })
  purchasePrice!: number

  @ApiProperty({ type: Number })
  usefulLifeMonths!: number

  @ApiPropertyOptional({ type: String, nullable: true })
  fundingSourceId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  imageUrl?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  notes?: string | null

  @ApiProperty({ type: Number })
  version!: number

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<NonNullable<LoanRepositoryOutput['items']>[number]>['unit']
      >['asset']
    >,
  ): InventoryLoanResponseItemsUnitAssetDto {
    const dto = new InventoryLoanResponseItemsUnitAssetDto()
    dto.id = domain.id
    dto.assetNumber = domain.assetNumber
    dto.name = domain.name
    dto.categoryId = domain.categoryId
    dto.brand = domain.brand
    dto.model = domain.model
    dto.purchaseDate = domain.purchaseDate.toISOString()
    dto.purchasePrice = Number(domain.purchasePrice)
    dto.usefulLifeMonths = domain.usefulLifeMonths
    dto.fundingSourceId = domain.fundingSourceId
    dto.imageUrl = domain.imageUrl
    dto.notes = domain.notes
    dto.version = domain.version
    dto.createdAt = domain.createdAt.toISOString()
    dto.updatedAt = domain.updatedAt.toISOString()
    return dto
  }
}

export class InventoryLoanResponseItemsUnitLocationDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  building?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  room?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  rack?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  description?: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<NonNullable<LoanRepositoryOutput['items']>[number]>['unit']
      >['location']
    >,
  ): InventoryLoanResponseItemsUnitLocationDto {
    const dto = new InventoryLoanResponseItemsUnitLocationDto()
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

export class InventoryLoanResponseItemsUnitStatusDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  allowTransactions!: boolean

  @ApiPropertyOptional({ type: String, nullable: true })
  systemKey?: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<NonNullable<LoanRepositoryOutput['items']>[number]>['unit']
      >['status']
    >,
  ): InventoryLoanResponseItemsUnitStatusDto {
    const dto = new InventoryLoanResponseItemsUnitStatusDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    dto.allowTransactions = domain.allowTransactions
    dto.systemKey = domain.systemKey
    dto.createdAt = domain.createdAt.toISOString()
    return dto
  }
}

export class InventoryLoanResponseItemsUnitConditionDto {
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
        NonNullable<NonNullable<LoanRepositoryOutput['items']>[number]>['unit']
      >['condition']
    >,
  ): InventoryLoanResponseItemsUnitConditionDto {
    const dto = new InventoryLoanResponseItemsUnitConditionDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    dto.isUsable = domain.isUsable
    dto.createdAt = domain.createdAt.toISOString()
    return dto
  }
}

export class InventoryLoanResponseItemsUnitDto {
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

  @ApiProperty({ type: Number })
  version!: number

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string

  @ApiPropertyOptional({ type: () => InventoryLoanResponseItemsUnitAssetDto })
  asset?: InventoryLoanResponseItemsUnitAssetDto

  @ApiPropertyOptional({
    type: () => InventoryLoanResponseItemsUnitLocationDto,
  })
  location?: InventoryLoanResponseItemsUnitLocationDto

  @ApiPropertyOptional({ type: () => InventoryLoanResponseItemsUnitStatusDto })
  status?: InventoryLoanResponseItemsUnitStatusDto

  @ApiPropertyOptional({
    type: () => InventoryLoanResponseItemsUnitConditionDto,
  })
  condition?: InventoryLoanResponseItemsUnitConditionDto

  static fromDomain(
    domain: NonNullable<
      NonNullable<NonNullable<LoanRepositoryOutput['items']>[number]>['unit']
    >,
  ): InventoryLoanResponseItemsUnitDto {
    const dto = new InventoryLoanResponseItemsUnitDto()
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
    dto.createdAt = domain.createdAt.toISOString()
    dto.updatedAt = domain.updatedAt.toISOString()
    if (domain.asset !== undefined)
      dto.asset =
        domain.asset == null
          ? domain.asset
          : InventoryLoanResponseItemsUnitAssetDto.fromDomain(domain.asset)
    if (domain.location !== undefined)
      dto.location =
        domain.location == null
          ? domain.location
          : InventoryLoanResponseItemsUnitLocationDto.fromDomain(
              domain.location,
            )
    if (domain.status !== undefined)
      dto.status =
        domain.status == null
          ? domain.status
          : InventoryLoanResponseItemsUnitStatusDto.fromDomain(domain.status)
    if (domain.condition !== undefined)
      dto.condition =
        domain.condition == null
          ? domain.condition
          : InventoryLoanResponseItemsUnitConditionDto.fromDomain(
              domain.condition,
            )
    return dto
  }
}

export class InventoryLoanResponseItemsDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  loanId!: string

  @ApiProperty({ type: String })
  unitId!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  returnedConditionId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  note?: string | null

  @ApiPropertyOptional({ type: () => InventoryLoanResponseItemsUnitDto })
  unit?: InventoryLoanResponseItemsUnitDto

  @ApiPropertyOptional({ type: String, nullable: true })
  notes?: string | null

  static fromDomain(
    domain: NonNullable<NonNullable<LoanRepositoryOutput['items']>[number]>,
  ): InventoryLoanResponseItemsDto {
    const dto = new InventoryLoanResponseItemsDto()
    dto.id = domain.id
    dto.loanId = domain.loanId
    dto.unitId = domain.unitId
    dto.returnedConditionId = domain.returnedConditionId
    dto.note = domain.note
    if (domain.unit !== undefined)
      dto.unit =
        domain.unit == null
          ? domain.unit
          : InventoryLoanResponseItemsUnitDto.fromDomain(domain.unit)
    dto.notes = domain.notes
    return dto
  }
}

export class InventoryLoanResponseRequesterDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  static fromDomain(
    domain: NonNullable<LoanRepositoryOutput['requester']>,
  ): InventoryLoanResponseRequesterDto {
    const dto = new InventoryLoanResponseRequesterDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    return dto
  }
}

export class InventoryLoanResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  loanNumber!: string

  @ApiProperty({ type: String })
  requesterId!: string

  @ApiProperty({ type: String, format: 'date-time' })
  expectedReturnDate!: string

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  actualReturnDate?: string | null

  @ApiProperty({ type: String })
  purpose!: string

  @ApiProperty({ type: String })
  statusId!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  workflowInstanceId?: string | null

  @ApiPropertyOptional({
    type: () => InventoryLoanResponseStatusDto,
    nullable: true,
  })
  status?: InventoryLoanResponseStatusDto | null

  @ApiPropertyOptional({
    type: () => InventoryLoanResponseItemsDto,
    isArray: true,
  })
  items?: InventoryLoanResponseItemsDto[]

  @ApiPropertyOptional({
    type: () => InventoryLoanResponseRequesterDto,
    nullable: true,
  })
  requester?: InventoryLoanResponseRequesterDto | null

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  createdAt?: string

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  updatedAt?: string

  static fromDomain(domain: LoanRepositoryOutput): InventoryLoanResponseDto {
    const dto = new InventoryLoanResponseDto()
    dto.id = domain.id
    dto.loanNumber = domain.loanNumber
    dto.requesterId = domain.requesterId
    dto.expectedReturnDate = domain.expectedReturnDate.toISOString()
    if (domain.actualReturnDate !== undefined)
      dto.actualReturnDate =
        domain.actualReturnDate == null
          ? domain.actualReturnDate
          : domain.actualReturnDate.toISOString()
    dto.purpose = domain.purpose
    dto.statusId = domain.statusId
    dto.workflowInstanceId = domain.workflowInstanceId
    if (domain.status !== undefined)
      dto.status =
        domain.status == null
          ? domain.status
          : InventoryLoanResponseStatusDto.fromDomain(domain.status)
    if (domain.items !== undefined)
      dto.items =
        domain.items == null
          ? domain.items
          : domain.items.map((x) => InventoryLoanResponseItemsDto.fromDomain(x))
    if (domain.requester !== undefined)
      dto.requester =
        domain.requester == null
          ? domain.requester
          : InventoryLoanResponseRequesterDto.fromDomain(domain.requester)
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

export class InventoryLoanListItemResponseStatusDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  systemKey?: string | null

  @ApiProperty({ type: Boolean })
  allowTransactions!: boolean

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  createdAt?: string

  static fromDomain(
    domain: NonNullable<LoanRepositoryOutput['status']>,
  ): InventoryLoanListItemResponseStatusDto {
    const dto = new InventoryLoanListItemResponseStatusDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    dto.systemKey = domain.systemKey
    dto.allowTransactions = domain.allowTransactions
    if (domain.createdAt !== undefined)
      dto.createdAt =
        domain.createdAt == null
          ? domain.createdAt
          : domain.createdAt.toISOString()
    return dto
  }
}

export class InventoryLoanListItemResponseItemsUnitAssetDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  assetNumber!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: String })
  categoryId!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  brand?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  model?: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  purchaseDate!: string

  @ApiProperty({ type: Number })
  purchasePrice!: number

  @ApiProperty({ type: Number })
  usefulLifeMonths!: number

  @ApiPropertyOptional({ type: String, nullable: true })
  fundingSourceId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  imageUrl?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  notes?: string | null

  @ApiProperty({ type: Number })
  version!: number

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<NonNullable<LoanRepositoryOutput['items']>[number]>['unit']
      >['asset']
    >,
  ): InventoryLoanListItemResponseItemsUnitAssetDto {
    const dto = new InventoryLoanListItemResponseItemsUnitAssetDto()
    dto.id = domain.id
    dto.assetNumber = domain.assetNumber
    dto.name = domain.name
    dto.categoryId = domain.categoryId
    dto.brand = domain.brand
    dto.model = domain.model
    dto.purchaseDate = domain.purchaseDate.toISOString()
    dto.purchasePrice = Number(domain.purchasePrice)
    dto.usefulLifeMonths = domain.usefulLifeMonths
    dto.fundingSourceId = domain.fundingSourceId
    dto.imageUrl = domain.imageUrl
    dto.notes = domain.notes
    dto.version = domain.version
    dto.createdAt = domain.createdAt.toISOString()
    dto.updatedAt = domain.updatedAt.toISOString()
    return dto
  }
}

export class InventoryLoanListItemResponseItemsUnitLocationDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  building?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  room?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  rack?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  description?: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<NonNullable<LoanRepositoryOutput['items']>[number]>['unit']
      >['location']
    >,
  ): InventoryLoanListItemResponseItemsUnitLocationDto {
    const dto = new InventoryLoanListItemResponseItemsUnitLocationDto()
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

export class InventoryLoanListItemResponseItemsUnitStatusDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  allowTransactions!: boolean

  @ApiPropertyOptional({ type: String, nullable: true })
  systemKey?: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<
        NonNullable<NonNullable<LoanRepositoryOutput['items']>[number]>['unit']
      >['status']
    >,
  ): InventoryLoanListItemResponseItemsUnitStatusDto {
    const dto = new InventoryLoanListItemResponseItemsUnitStatusDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    dto.allowTransactions = domain.allowTransactions
    dto.systemKey = domain.systemKey
    dto.createdAt = domain.createdAt.toISOString()
    return dto
  }
}

export class InventoryLoanListItemResponseItemsUnitConditionDto {
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
        NonNullable<NonNullable<LoanRepositoryOutput['items']>[number]>['unit']
      >['condition']
    >,
  ): InventoryLoanListItemResponseItemsUnitConditionDto {
    const dto = new InventoryLoanListItemResponseItemsUnitConditionDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    dto.isUsable = domain.isUsable
    dto.createdAt = domain.createdAt.toISOString()
    return dto
  }
}

export class InventoryLoanListItemResponseItemsUnitDto {
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

  @ApiProperty({ type: Number })
  version!: number

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string

  @ApiPropertyOptional({
    type: () => InventoryLoanListItemResponseItemsUnitAssetDto,
  })
  asset?: InventoryLoanListItemResponseItemsUnitAssetDto

  @ApiPropertyOptional({
    type: () => InventoryLoanListItemResponseItemsUnitLocationDto,
  })
  location?: InventoryLoanListItemResponseItemsUnitLocationDto

  @ApiPropertyOptional({
    type: () => InventoryLoanListItemResponseItemsUnitStatusDto,
  })
  status?: InventoryLoanListItemResponseItemsUnitStatusDto

  @ApiPropertyOptional({
    type: () => InventoryLoanListItemResponseItemsUnitConditionDto,
  })
  condition?: InventoryLoanListItemResponseItemsUnitConditionDto

  static fromDomain(
    domain: NonNullable<
      NonNullable<NonNullable<LoanRepositoryOutput['items']>[number]>['unit']
    >,
  ): InventoryLoanListItemResponseItemsUnitDto {
    const dto = new InventoryLoanListItemResponseItemsUnitDto()
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
    dto.createdAt = domain.createdAt.toISOString()
    dto.updatedAt = domain.updatedAt.toISOString()
    if (domain.asset !== undefined)
      dto.asset =
        domain.asset == null
          ? domain.asset
          : InventoryLoanListItemResponseItemsUnitAssetDto.fromDomain(
              domain.asset,
            )
    if (domain.location !== undefined)
      dto.location =
        domain.location == null
          ? domain.location
          : InventoryLoanListItemResponseItemsUnitLocationDto.fromDomain(
              domain.location,
            )
    if (domain.status !== undefined)
      dto.status =
        domain.status == null
          ? domain.status
          : InventoryLoanListItemResponseItemsUnitStatusDto.fromDomain(
              domain.status,
            )
    if (domain.condition !== undefined)
      dto.condition =
        domain.condition == null
          ? domain.condition
          : InventoryLoanListItemResponseItemsUnitConditionDto.fromDomain(
              domain.condition,
            )
    return dto
  }
}

export class InventoryLoanListItemResponseItemsDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  loanId!: string

  @ApiProperty({ type: String })
  unitId!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  returnedConditionId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  note?: string | null

  @ApiPropertyOptional({
    type: () => InventoryLoanListItemResponseItemsUnitDto,
  })
  unit?: InventoryLoanListItemResponseItemsUnitDto

  @ApiPropertyOptional({ type: String, nullable: true })
  notes?: string | null

  static fromDomain(
    domain: NonNullable<NonNullable<LoanRepositoryOutput['items']>[number]>,
  ): InventoryLoanListItemResponseItemsDto {
    const dto = new InventoryLoanListItemResponseItemsDto()
    dto.id = domain.id
    dto.loanId = domain.loanId
    dto.unitId = domain.unitId
    dto.returnedConditionId = domain.returnedConditionId
    dto.note = domain.note
    if (domain.unit !== undefined)
      dto.unit =
        domain.unit == null
          ? domain.unit
          : InventoryLoanListItemResponseItemsUnitDto.fromDomain(domain.unit)
    dto.notes = domain.notes
    return dto
  }
}

export class InventoryLoanListItemResponseRequesterDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  identifier!: string

  static fromDomain(
    domain: NonNullable<LoanRepositoryOutput['requester']>,
  ): InventoryLoanListItemResponseRequesterDto {
    const dto = new InventoryLoanListItemResponseRequesterDto()
    dto.id = domain.id
    dto.identifier = domain.identifier
    return dto
  }
}

export class InventoryLoanListItemResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  loanNumber!: string

  @ApiProperty({ type: String })
  requesterId!: string

  @ApiProperty({ type: String, format: 'date-time' })
  expectedReturnDate!: string

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  actualReturnDate?: string | null

  @ApiProperty({ type: String })
  purpose!: string

  @ApiProperty({ type: String })
  statusId!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  workflowInstanceId?: string | null

  @ApiPropertyOptional({
    type: () => InventoryLoanListItemResponseStatusDto,
    nullable: true,
  })
  status?: InventoryLoanListItemResponseStatusDto | null

  @ApiPropertyOptional({
    type: () => InventoryLoanListItemResponseItemsDto,
    isArray: true,
  })
  items?: InventoryLoanListItemResponseItemsDto[]

  @ApiPropertyOptional({
    type: () => InventoryLoanListItemResponseRequesterDto,
    nullable: true,
  })
  requester?: InventoryLoanListItemResponseRequesterDto | null

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  createdAt?: string

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  updatedAt?: string

  static fromDomain(
    domain: LoanRepositoryOutput,
  ): InventoryLoanListItemResponseDto {
    const dto = new InventoryLoanListItemResponseDto()
    dto.id = domain.id
    dto.loanNumber = domain.loanNumber
    dto.requesterId = domain.requesterId
    dto.expectedReturnDate = domain.expectedReturnDate.toISOString()
    if (domain.actualReturnDate !== undefined)
      dto.actualReturnDate =
        domain.actualReturnDate == null
          ? domain.actualReturnDate
          : domain.actualReturnDate.toISOString()
    dto.purpose = domain.purpose
    dto.statusId = domain.statusId
    dto.workflowInstanceId = domain.workflowInstanceId
    if (domain.status !== undefined)
      dto.status =
        domain.status == null
          ? domain.status
          : InventoryLoanListItemResponseStatusDto.fromDomain(domain.status)
    if (domain.items !== undefined)
      dto.items =
        domain.items == null
          ? domain.items
          : domain.items.map((x) =>
              InventoryLoanListItemResponseItemsDto.fromDomain(x),
            )
    if (domain.requester !== undefined)
      dto.requester =
        domain.requester == null
          ? domain.requester
          : InventoryLoanListItemResponseRequesterDto.fromDomain(
              domain.requester,
            )
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

export class InventoryLoanListResponseDto {
  @ApiProperty({ type: () => [InventoryLoanListItemResponseDto] })
  data!: InventoryLoanListItemResponseDto[]

  @ApiProperty({ type: Number })
  total!: number

  @ApiProperty({ type: Number })
  page!: number

  @ApiProperty({ type: Number })
  limit!: number

  static fromDomain(domain: {
    data: LoanRepositoryOutput[]
    total: number
    page: number
    limit: number
  }): InventoryLoanListResponseDto {
    const dto = new InventoryLoanListResponseDto()
    dto.data = domain.data.map((item) =>
      InventoryLoanListItemResponseDto.fromDomain(item),
    )
    dto.total = domain.total
    dto.page = domain.page
    dto.limit = domain.limit
    return dto
  }
}

export class InventoryHistoryResponseUnitAssetDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  assetNumber!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: String })
  categoryId!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  brand?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  model?: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  purchaseDate!: string

  @ApiProperty({ type: Number })
  purchasePrice!: number

  @ApiProperty({ type: Number })
  usefulLifeMonths!: number

  @ApiPropertyOptional({ type: String, nullable: true })
  fundingSourceId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  imageUrl?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  notes?: string | null

  @ApiProperty({ type: Number })
  version!: number

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string

  static fromDomain(
    domain: NonNullable<NonNullable<HistoryRepositoryOutput['unit']>['asset']>,
  ): InventoryHistoryResponseUnitAssetDto {
    const dto = new InventoryHistoryResponseUnitAssetDto()
    dto.id = domain.id
    dto.assetNumber = domain.assetNumber
    dto.name = domain.name
    dto.categoryId = domain.categoryId
    dto.brand = domain.brand
    dto.model = domain.model
    dto.purchaseDate = domain.purchaseDate.toISOString()
    dto.purchasePrice = Number(domain.purchasePrice)
    dto.usefulLifeMonths = domain.usefulLifeMonths
    dto.fundingSourceId = domain.fundingSourceId
    dto.imageUrl = domain.imageUrl
    dto.notes = domain.notes
    dto.version = domain.version
    dto.createdAt = domain.createdAt.toISOString()
    dto.updatedAt = domain.updatedAt.toISOString()
    return dto
  }
}

export class InventoryHistoryResponseUnitLocationDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  building?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  room?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  rack?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  description?: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  static fromDomain(
    domain: NonNullable<
      NonNullable<HistoryRepositoryOutput['unit']>['location']
    >,
  ): InventoryHistoryResponseUnitLocationDto {
    const dto = new InventoryHistoryResponseUnitLocationDto()
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

export class InventoryHistoryResponseUnitStatusDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: Boolean })
  allowTransactions!: boolean

  @ApiPropertyOptional({ type: String, nullable: true })
  systemKey?: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  static fromDomain(
    domain: NonNullable<NonNullable<HistoryRepositoryOutput['unit']>['status']>,
  ): InventoryHistoryResponseUnitStatusDto {
    const dto = new InventoryHistoryResponseUnitStatusDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    dto.allowTransactions = domain.allowTransactions
    dto.systemKey = domain.systemKey
    dto.createdAt = domain.createdAt.toISOString()
    return dto
  }
}

export class InventoryHistoryResponseUnitConditionDto {
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
      NonNullable<HistoryRepositoryOutput['unit']>['condition']
    >,
  ): InventoryHistoryResponseUnitConditionDto {
    const dto = new InventoryHistoryResponseUnitConditionDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    dto.isUsable = domain.isUsable
    dto.createdAt = domain.createdAt.toISOString()
    return dto
  }
}

export class InventoryHistoryResponseUnitDto {
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

  @ApiProperty({ type: Number })
  version!: number

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string

  @ApiPropertyOptional({ type: () => InventoryHistoryResponseUnitAssetDto })
  asset?: InventoryHistoryResponseUnitAssetDto

  @ApiPropertyOptional({ type: () => InventoryHistoryResponseUnitLocationDto })
  location?: InventoryHistoryResponseUnitLocationDto

  @ApiPropertyOptional({ type: () => InventoryHistoryResponseUnitStatusDto })
  status?: InventoryHistoryResponseUnitStatusDto

  @ApiPropertyOptional({ type: () => InventoryHistoryResponseUnitConditionDto })
  condition?: InventoryHistoryResponseUnitConditionDto

  static fromDomain(
    domain: NonNullable<HistoryRepositoryOutput['unit']>,
  ): InventoryHistoryResponseUnitDto {
    const dto = new InventoryHistoryResponseUnitDto()
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
    dto.createdAt = domain.createdAt.toISOString()
    dto.updatedAt = domain.updatedAt.toISOString()
    if (domain.asset !== undefined)
      dto.asset =
        domain.asset == null
          ? domain.asset
          : InventoryHistoryResponseUnitAssetDto.fromDomain(domain.asset)
    if (domain.location !== undefined)
      dto.location =
        domain.location == null
          ? domain.location
          : InventoryHistoryResponseUnitLocationDto.fromDomain(domain.location)
    if (domain.status !== undefined)
      dto.status =
        domain.status == null
          ? domain.status
          : InventoryHistoryResponseUnitStatusDto.fromDomain(domain.status)
    if (domain.condition !== undefined)
      dto.condition =
        domain.condition == null
          ? domain.condition
          : InventoryHistoryResponseUnitConditionDto.fromDomain(
              domain.condition,
            )
    return dto
  }
}

export class InventoryHistoryResponseTransactionTypeDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: String })
  direction!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  description?: string | null

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  static fromDomain(
    domain: NonNullable<HistoryRepositoryOutput['transactionType']>,
  ): InventoryHistoryResponseTransactionTypeDto {
    const dto = new InventoryHistoryResponseTransactionTypeDto()
    dto.id = domain.id
    dto.code = domain.code
    dto.name = domain.name
    dto.direction = domain.direction
    dto.description = domain.description
    dto.createdAt = domain.createdAt.toISOString()
    return dto
  }
}

export class InventoryHistoryResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  unitId!: string

  @ApiProperty({ type: String })
  transactionTypeId!: string

  @ApiPropertyOptional({ type: String, nullable: true })
  previousConditionId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  newConditionId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  previousStatusId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  newStatusId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  previousLocationId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  newLocationId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  previousCustodianId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  newCustodianId?: string | null

  @ApiPropertyOptional({ type: String, nullable: true })
  note?: string | null

  @ApiProperty({ type: String })
  changedById!: string

  @ApiProperty({ type: String, format: 'date-time' })
  changedAt!: string

  @ApiPropertyOptional({ type: () => InventoryHistoryResponseUnitDto })
  unit?: InventoryHistoryResponseUnitDto

  @ApiPropertyOptional({
    type: () => InventoryHistoryResponseTransactionTypeDto,
  })
  transactionType?: InventoryHistoryResponseTransactionTypeDto

  @ApiPropertyOptional({ type: String, nullable: true })
  operationKey?: string | null

  static fromDomain(
    domain: HistoryRepositoryOutput,
  ): InventoryHistoryResponseDto {
    const dto = new InventoryHistoryResponseDto()
    dto.id = domain.id
    dto.unitId = domain.unitId
    dto.transactionTypeId = domain.transactionTypeId
    dto.previousConditionId = domain.previousConditionId
    dto.newConditionId = domain.newConditionId
    dto.previousStatusId = domain.previousStatusId
    dto.newStatusId = domain.newStatusId
    dto.previousLocationId = domain.previousLocationId
    dto.newLocationId = domain.newLocationId
    dto.previousCustodianId = domain.previousCustodianId
    dto.newCustodianId = domain.newCustodianId
    dto.note = domain.note
    dto.changedById = domain.changedById
    dto.changedAt = domain.changedAt.toISOString()
    if (domain.unit !== undefined)
      dto.unit =
        domain.unit == null
          ? domain.unit
          : InventoryHistoryResponseUnitDto.fromDomain(domain.unit)
    if (domain.transactionType !== undefined)
      dto.transactionType =
        domain.transactionType == null
          ? domain.transactionType
          : InventoryHistoryResponseTransactionTypeDto.fromDomain(
              domain.transactionType,
            )
    dto.operationKey = domain.operationKey
    return dto
  }
}

export class InventoryHistoryListResponseDto {
  @ApiProperty({ type: () => [InventoryHistoryResponseDto] })
  data!: InventoryHistoryResponseDto[]

  @ApiProperty({ type: Number })
  total!: number

  @ApiProperty({ type: Number })
  page!: number

  @ApiProperty({ type: Number })
  limit!: number

  static fromDomain(domain: {
    data: HistoryRepositoryOutput[]
    total: number
    page: number
    limit: number
  }): InventoryHistoryListResponseDto {
    const dto = new InventoryHistoryListResponseDto()
    dto.data = domain.data.map((item) =>
      InventoryHistoryResponseDto.fromDomain(item),
    )
    dto.total = domain.total
    dto.page = domain.page
    dto.limit = domain.limit
    return dto
  }
}
