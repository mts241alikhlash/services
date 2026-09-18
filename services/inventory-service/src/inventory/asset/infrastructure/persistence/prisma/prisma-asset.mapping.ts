import { Prisma } from '@prisma/client'
import type { CodedRef } from '../../../../../shared/domain/entities/reference.entity.js'
import type { AssetConditionLookupOutput } from '../../../domain/repositories/condition-lookup.port.js'
import type { AssetFundingSourceLookupOutput } from '../../../domain/repositories/funding-source-lookup.port.js'
import type {
  AssetRecordOutput,
  AssetRepositoryOutput,
} from '../../../domain/repositories/asset.repository.js'
import type { AssetLocationLookupOutput } from '../../../domain/repositories/location-lookup.port.js'
import type { AssetStatusLookupOutput } from '../../../domain/repositories/status-lookup.port.js'
import type { AssetUnitRepositoryOutput } from '../../../domain/repositories/asset-unit.repository.js'
import type { AssetWithDetails } from './prisma-asset.includes.js'

export interface AssetRecord {
  id: string
  assetNumber: string
  name: string
  categoryId: string
  fundingSourceId: string | null
  brand: string | null
  model: string | null
  purchaseDate: Date
  purchasePrice: Prisma.Decimal
  usefulLifeMonths: number
  notes: string | null
  deletedAt: Date | null
}

type AssetUnitDetails = NonNullable<AssetWithDetails['units']>[number]

export type AssetWithReferences = Omit<AssetWithDetails, 'units'> & {
  category: { id: string; code: string; name: string } | null
  fundingSource: AssetFundingSourceLookupOutput | null
  units: (AssetUnitDetails & {
    condition: AssetConditionLookupOutput | null
    status: AssetStatusLookupOutput | null
    location: AssetLocationLookupOutput | null
  })[]
}

export function mapReference(reference: {
  id: string
  code: string
  name: string
}): CodedRef {
  return {
    id: reference.id,
    code: reference.code,
    name: reference.name,
  }
}

export function mapAssetRecord(asset: AssetRecord): AssetRecordOutput {
  return {
    id: asset.id,
    assetNumber: asset.assetNumber,
    name: asset.name,
    categoryId: asset.categoryId,
    fundingSourceId: asset.fundingSourceId,
    brand: asset.brand,
    model: asset.model,
    purchaseDate: asset.purchaseDate,
    purchasePrice: asset.purchasePrice,
    usefulLifeMonths: asset.usefulLifeMonths,
    notes: asset.notes,
    deletedAt: asset.deletedAt,
  }
}

function mapAssetUnit(
  unit: AssetWithReferences['units'][number],
): AssetUnitRepositoryOutput {
  return {
    id: unit.id,
    assetId: unit.assetId,
    unitNumber: unit.unitNumber,
    barcode: unit.barcode,
    currentBookValue: unit.currentBookValue,
    conditionId: unit.conditionId,
    statusId: unit.statusId,
    locationId: unit.locationId,
    custodianId: unit.custodianId,
    notes: unit.notes,
    deletedAt: unit.deletedAt,
    ...(unit.condition && { condition: mapReference(unit.condition) }),
    ...(unit.status && { status: mapReference(unit.status) }),
    ...(unit.location && { location: mapReference(unit.location) }),
  }
}

export function mapAsset(asset: AssetWithReferences): AssetRepositoryOutput {
  return {
    ...mapAssetRecord(asset),
    ...(asset.category && { category: mapReference(asset.category) }),
    fundingSource: asset.fundingSource
      ? mapReference(asset.fundingSource)
      : null,
    units: asset.units?.map(mapAssetUnit),
    _count: { units: asset._count.units },
  }
}
