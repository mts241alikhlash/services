import type { CodedRef } from '../../../../shared/domain/entities/reference.entity.js'
import type {
  PaginatedResult,
  PaginationQueryInput,
} from '../../../../shared/domain/interfaces/repository.interface.js'
import type { DecimalValue } from '../../../../shared/domain/types/decimal.type.js'
import type { AssetConditionLookupOutput } from './condition-lookup.port.js'
import type { AssetLocationLookupOutput } from './location-lookup.port.js'
import type { AssetStatusLookupOutput } from './status-lookup.port.js'

export interface AssetUnitQueryInput extends PaginationQueryInput {
  lendable?: boolean
  search?: string
}

export interface CreateAssetUnitRepositoryInput {
  assetId: string
  unitNumber: string
  barcode: string
  currentBookValue: DecimalValue
  conditionId: string
  statusId: string
  locationId: string
  custodianId?: string | null
  notes?: string | null
}

export interface UpdateAssetUnitRepositoryInput {
  barcode?: string
  notes?: string
  custodianId?: string
  conditionId?: string
  statusId?: string
  locationId?: string
}

export interface UpdateAssetUnitStatusesRepositoryInput {
  unitIds: string[]
  statusId: string
}

export interface UpdateAssetUnitConditionRepositoryInput {
  unitId: string
  conditionId: string
}

export interface AssetUnitCapabilityOutput {
  id: string
  unitNumber: string
  statusId: string
  asset: { name: string }
  status: { allowTransactions: boolean } | null
}

export interface AssetUnitDetailsCapabilityOutput extends AssetUnitRecordOutput {
  version: number
  createdAt: Date
  updatedAt: Date
  asset: {
    id: string
    assetNumber: string
    name: string
    categoryId: string
    brand: string | null
    model: string | null
    purchaseDate: Date
    purchasePrice: DecimalValue
    usefulLifeMonths: number
    fundingSourceId: string | null
    imageUrl: string | null
    notes: string | null
    version: number
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
  }
  condition?: AssetConditionLookupOutput | null
  status?: AssetStatusLookupOutput | null
  location?: AssetLocationLookupOutput | null
}

export interface AssetUnitRecordOutput {
  id: string
  assetId: string
  unitNumber: string
  barcode?: string | null
  currentBookValue: DecimalValue
  conditionId: string
  statusId: string
  locationId: string
  custodianId?: string | null
  notes?: string | null
  deletedAt?: Date | null
}

export interface AssetUnitAssetOutput {
  id: string
  assetNumber: string
  name: string
  category: CodedRef | null
}

export interface AssetUnitRepositoryOutput extends AssetUnitRecordOutput {
  asset?: AssetUnitAssetOutput
  condition?: CodedRef
  status?: CodedRef
  location?: CodedRef
}

export abstract class IAssetUnitRepository {
  abstract findAll(
    query: AssetUnitQueryInput,
  ): Promise<PaginatedResult<AssetUnitRepositoryOutput>>
  abstract findById(id: string): Promise<AssetUnitRepositoryOutput | null>
  abstract findByUnitCode(
    unitCode: string,
    excludeId?: string,
  ): Promise<AssetUnitRecordOutput | null>
  abstract findByBarcode(
    barcode: string,
    excludeId?: string,
  ): Promise<AssetUnitRecordOutput | null>
  abstract create(
    input: CreateAssetUnitRepositoryInput,
  ): Promise<AssetUnitRepositoryOutput>
  abstract update(
    id: string,
    input: UpdateAssetUnitRepositoryInput,
  ): Promise<AssetUnitRepositoryOutput>
  abstract remove(id: string): Promise<AssetUnitRecordOutput>
  abstract softDelete(id: string): Promise<AssetUnitRecordOutput>
  abstract findLatestUnit(
    assetId: string,
  ): Promise<AssetUnitRecordOutput | null>
  abstract createMany(inputs: CreateAssetUnitRepositoryInput[]): Promise<number>
  abstract findByAsset(assetId: string): Promise<AssetUnitRepositoryOutput[]>
}

export abstract class IAssetUnitMutationPort {
  abstract updateStatuses(
    input: UpdateAssetUnitStatusesRepositoryInput,
  ): Promise<void>
  abstract updateCondition(
    input: UpdateAssetUnitConditionRepositoryInput,
  ): Promise<void>
}

export abstract class IAssetUnitCapabilityPort {
  abstract findByIds(ids: string[]): Promise<AssetUnitCapabilityOutput[]>
}

export abstract class IAssetUnitDetailsCapabilityPort {
  abstract findLiveIds(ids?: string[]): Promise<string[]>
  abstract findDetailsByIds(
    ids: string[],
  ): Promise<AssetUnitDetailsCapabilityOutput[]>
}
