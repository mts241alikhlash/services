import type { CodedRef } from '../../../../shared/domain/entities/reference.entity.js'
import type {
  PaginatedResult,
  PaginationQueryInput,
} from '../../../../shared/domain/interfaces/repository.interface.js'
import type { DecimalValue } from '../../../../shared/domain/types/decimal.type.js'
import type { AssetUnitRepositoryOutput } from './asset-unit.repository.js'

export interface AssetQueryInput extends PaginationQueryInput {
  keyword?: string
  categoryId?: string
  locationId?: string
  statusId?: string
  conditionId?: string
  fundingSourceId?: string
}

export interface CreateAssetUnitSeedInput {
  unitNumber: string
  barcode: string
  currentBookValue: DecimalValue
  conditionId: string
  statusId: string
  locationId: string
}

export interface CreateAssetRepositoryInput {
  assetNumber: string
  name: string
  brand?: string | null
  model?: string | null
  purchaseDate: Date
  purchasePrice: number
  usefulLifeMonths?: number
  notes?: string | null
  categoryId: string
  fundingSourceId?: string | null
  units: CreateAssetUnitSeedInput[]
}

export interface UpdateAssetRepositoryInput {
  name?: string
  brand?: string
  model?: string
  assetNumber?: string
  purchaseDate?: Date
  purchasePrice?: number
  usefulLifeMonths?: number
  notes?: string
  categoryId?: string
  fundingSourceId?: string | null
}

export interface AssetRecordOutput {
  id: string
  assetNumber: string
  name: string
  categoryId: string
  fundingSourceId?: string | null
  brand?: string | null
  model?: string | null
  purchaseDate: Date
  purchasePrice: DecimalValue
  usefulLifeMonths?: number | null
  notes?: string | null
  deletedAt?: Date | null
}

export interface AssetRepositoryOutput extends AssetRecordOutput {
  category?: CodedRef
  fundingSource?: CodedRef | null
  units?: AssetUnitRepositoryOutput[]
  _count?: { units?: number }
}

export interface AssetCategoryOutput {
  id: string
  code: string
}

export interface AssetLatestOutput {
  assetNumber: string
}

export interface AssetReferenceOutput {
  id: string
  assetNumber: string
  name: string
  category: CodedRef | null
}

export abstract class IAssetRepository {
  abstract findAll(
    query: AssetQueryInput,
  ): Promise<PaginatedResult<AssetRepositoryOutput>>
  abstract findById(id: string): Promise<AssetRepositoryOutput | null>
  abstract findReferenceById(id: string): Promise<AssetReferenceOutput | null>
  abstract findByCode(
    code: string,
    excludeId?: string,
  ): Promise<AssetRecordOutput | null>
  abstract create(
    input: CreateAssetRepositoryInput,
  ): Promise<AssetRepositoryOutput>
  abstract update(
    id: string,
    input: UpdateAssetRepositoryInput,
  ): Promise<AssetRepositoryOutput>
  abstract remove(id: string): Promise<AssetRecordOutput>
  abstract softDelete(id: string): Promise<AssetRecordOutput>
  abstract countUnits(id: string): Promise<number>
  abstract findCategoryById(id: string): Promise<AssetCategoryOutput | null>
  abstract findLatestAssetByPrefix(
    prefix: string,
  ): Promise<AssetLatestOutput | null>
}
