import { Prisma } from '@prisma/client'
import type { CodedRef } from '../../../../../shared/domain/entities/reference.entity.js'
import type { IAssetRepository } from '../../../domain/repositories/asset.repository.js'
import type { IAssetConditionLookupPort } from '../../../domain/repositories/condition-lookup.port.js'
import type { IAssetLocationLookupPort } from '../../../domain/repositories/location-lookup.port.js'
import type { IAssetStatusLookupPort } from '../../../domain/repositories/status-lookup.port.js'
import type { AssetUnitWithAsset } from './prisma-asset-unit.includes.js'
import type {
  AssetUnitCapabilityOutput,
  AssetUnitDetailsCapabilityOutput,
  AssetUnitRepositoryOutput,
  AssetUnitRecordOutput,
} from '../../../domain/repositories/asset-unit.repository.js'
import type { PrismaService } from '../../../../../core/database/prisma.service.js'

export interface AssetUnitRepositoryDependencies {
  prisma: PrismaService
  assetRepository: IAssetRepository
  conditionLookup: IAssetConditionLookupPort
  statusLookup: IAssetStatusLookupPort
  locationLookup: IAssetLocationLookupPort
}

export interface UnitRecord {
  id: string
  assetId: string
  unitNumber: string
  barcode: string | null
  currentBookValue: Prisma.Decimal
  conditionId: string
  statusId: string
  locationId: string
  custodianId: string | null
  notes: string | null
  deletedAt: Date | null
}

type UnitDetailsRecord = AssetUnitWithAsset

export type HydratedUnit = AssetUnitRepositoryOutput & {
  statusAllowsTransactions: boolean
}

function mapReference(reference: {
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

export function mapUnitRecord(unit: UnitRecord): AssetUnitRecordOutput {
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
  }
}

function mapUnitRecordWithReferences(
  unit: UnitRecord,
  references: {
    asset: AssetUnitRepositoryOutput['asset']
    condition: CodedRef | null
    status: CodedRef | null
    location: CodedRef | null
  },
): AssetUnitRepositoryOutput {
  return {
    ...mapUnitRecord(unit),
    ...(references.condition && { condition: references.condition }),
    ...(references.status && { status: references.status }),
    ...(references.location && { location: references.location }),
    ...(references.asset && { asset: references.asset }),
  }
}

function mapAssetDetails(asset: UnitDetailsRecord['asset']) {
  return {
    id: asset.id,
    assetNumber: asset.assetNumber,
    name: asset.name,
    categoryId: asset.categoryId,
    brand: asset.brand,
    model: asset.model,
    purchaseDate: asset.purchaseDate,
    purchasePrice: asset.purchasePrice,
    usefulLifeMonths: asset.usefulLifeMonths,
    fundingSourceId: asset.fundingSourceId,
    imageUrl: asset.imageUrl,
    notes: asset.notes,
    version: asset.version,
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
    deletedAt: asset.deletedAt,
  }
}

export function withoutTransactionFlag(
  unit: HydratedUnit,
): AssetUnitRepositoryOutput {
  const { statusAllowsTransactions: _, ...result } = unit
  return result
}

export async function hydrateUnit(
  dependencies: AssetUnitRepositoryDependencies,
  unit: UnitRecord,
): Promise<HydratedUnit> {
  const [asset, condition, status, location] = await Promise.all([
    dependencies.assetRepository.findReferenceById(unit.assetId),
    dependencies.conditionLookup.findById(unit.conditionId),
    dependencies.statusLookup.findById(unit.statusId),
    dependencies.locationLookup.findById(unit.locationId),
  ])

  return {
    ...mapUnitRecordWithReferences(unit, {
      asset: asset
        ? {
            id: asset.id,
            assetNumber: asset.assetNumber,
            name: asset.name,
            category: asset.category ?? null,
          }
        : undefined,
      condition: condition ? mapReference(condition) : null,
      status: status ? mapReference(status) : null,
      location: location ? mapReference(location) : null,
    }),
    statusAllowsTransactions: status?.allowTransactions === true,
  }
}

async function hydrateCapabilityUnit(
  dependencies: AssetUnitRepositoryDependencies,
  unit: UnitRecord,
): Promise<AssetUnitCapabilityOutput> {
  const [asset, status] = await Promise.all([
    dependencies.assetRepository.findReferenceById(unit.assetId),
    dependencies.statusLookup.findById(unit.statusId),
  ])

  return {
    id: unit.id,
    unitNumber: unit.unitNumber,
    statusId: unit.statusId,
    asset: { name: asset?.name ?? '' },
    status: status ? { allowTransactions: status.allowTransactions } : null,
  }
}

async function hydrateDetailsUnit(
  dependencies: AssetUnitRepositoryDependencies,
  unit: UnitDetailsRecord,
): Promise<AssetUnitDetailsCapabilityOutput> {
  const [condition, status, location] = await Promise.all([
    dependencies.conditionLookup.findById(unit.conditionId),
    dependencies.statusLookup.findById(unit.statusId),
    dependencies.locationLookup.findById(unit.locationId),
  ])

  return {
    ...mapUnitRecord(unit),
    version: unit.version,
    createdAt: unit.createdAt,
    updatedAt: unit.updatedAt,
    asset: mapAssetDetails(unit.asset),
    condition,
    status,
    location,
  }
}

export { hydrateCapabilityUnit, hydrateDetailsUnit }
