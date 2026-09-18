import { Prisma } from '@prisma/client'
import type { PrismaService } from '../../../../../core/database/prisma.service.js'
import type { PaginatedResult } from '../../../../../shared/domain/interfaces/repository.interface.js'
import type {
  AssetCategoryOutput,
  AssetLatestOutput,
  AssetQueryInput,
  AssetRecordOutput,
  AssetReferenceOutput,
  AssetRepositoryOutput,
} from '../../../domain/repositories/asset.repository.js'
import type { IAssetCategoryLookupPort } from '../../../domain/repositories/category-lookup.port.js'
import type { AssetCategoryLookupOutput } from '../../../domain/repositories/category-lookup.port.js'
import type { IAssetConditionLookupPort } from '../../../domain/repositories/condition-lookup.port.js'
import type { AssetConditionLookupOutput } from '../../../domain/repositories/condition-lookup.port.js'
import type { IAssetFundingSourceLookupPort } from '../../../domain/repositories/funding-source-lookup.port.js'
import type { AssetFundingSourceLookupOutput } from '../../../domain/repositories/funding-source-lookup.port.js'
import type { IAssetLocationLookupPort } from '../../../domain/repositories/location-lookup.port.js'
import type { AssetLocationLookupOutput } from '../../../domain/repositories/location-lookup.port.js'
import type { IAssetStatusLookupPort } from '../../../domain/repositories/status-lookup.port.js'
import {
  ASSET_WITH_DETAILS_INCLUDE,
  type AssetWithDetails,
} from './prisma-asset.includes.js'
import {
  mapAsset,
  mapAssetRecord,
  mapReference,
  type AssetWithReferences,
} from './prisma-asset.mapping.js'

export interface AssetRepositoryDependencies {
  prisma: PrismaService
  categoryLookup: IAssetCategoryLookupPort
  fundingSourceLookup: IAssetFundingSourceLookupPort
  conditionLookup: IAssetConditionLookupPort
  statusLookup: IAssetStatusLookupPort
  locationLookup: IAssetLocationLookupPort
}

export async function hydrateAsset(
  dependencies: AssetRepositoryDependencies,
  asset: AssetWithDetails,
): Promise<AssetWithReferences> {
  const [category, fundingSource] = await Promise.all([
    dependencies.categoryLookup.findById(asset.categoryId),
    asset.fundingSourceId
      ? dependencies.fundingSourceLookup.findById(asset.fundingSourceId)
      : Promise.resolve(null),
  ])
  const units = await Promise.all(
    (asset.units ?? []).map(async (unit) => {
      const [condition, status, location] = await Promise.all([
        dependencies.conditionLookup.findById(unit.conditionId),
        dependencies.statusLookup.findById(unit.statusId),
        dependencies.locationLookup.findById(unit.locationId),
      ])
      return { ...unit, condition, status, location }
    }),
  )
  return { ...asset, category, fundingSource, units }
}

function assetWhere(query: AssetQueryInput): Prisma.InventoryAssetWhereInput {
  const {
    keyword,
    categoryId,
    locationId,
    statusId,
    conditionId,
    fundingSourceId,
  } = query
  const where: Prisma.InventoryAssetWhereInput = { deletedAt: null }

  if (keyword && keyword.trim() !== '') {
    where.OR = [
      { name: { contains: keyword, mode: 'insensitive' } },
      { assetNumber: { contains: keyword, mode: 'insensitive' } },
      { brand: { contains: keyword, mode: 'insensitive' } },
      { model: { contains: keyword, mode: 'insensitive' } },
      {
        units: {
          some: {
            deletedAt: null,
            unitNumber: { contains: keyword, mode: 'insensitive' },
          },
        },
      },
      {
        units: {
          some: {
            deletedAt: null,
            barcode: { contains: keyword, mode: 'insensitive' },
          },
        },
      },
    ]
  }
  if (categoryId && categoryId !== 'all') where.categoryId = categoryId
  if (fundingSourceId && fundingSourceId !== 'all') {
    where.fundingSourceId = fundingSourceId
  }

  const unitFilter: Prisma.InventoryAssetUnitWhereInput = { deletedAt: null }
  if (locationId && locationId !== 'all') unitFilter.locationId = locationId
  if (statusId && statusId !== 'all') unitFilter.statusId = statusId
  if (conditionId && conditionId !== 'all') unitFilter.conditionId = conditionId
  if (Object.keys(unitFilter).length > 1) where.units = { some: unitFilter }
  return where
}

export async function findAllAssets(
  dependencies: AssetRepositoryDependencies,
  query: AssetQueryInput,
): Promise<PaginatedResult<AssetRepositoryOutput>> {
  const { page = 1, limit = 10 } = query
  const where = assetWhere(query)
  const [data, total] = await Promise.all([
    dependencies.prisma.inventoryAsset.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: ASSET_WITH_DETAILS_INCLUDE,
    }),
    dependencies.prisma.inventoryAsset.count({ where }),
  ])
  return {
    data: await Promise.all(
      data.map((asset) => hydrateAsset(dependencies, asset).then(mapAsset)),
    ),
    total,
    page,
    limit,
  }
}

export async function findAssetById(
  dependencies: AssetRepositoryDependencies,
  id: string,
): Promise<AssetRepositoryOutput | null> {
  const asset = await dependencies.prisma.inventoryAsset.findFirst({
    where: { id, deletedAt: null },
    include: ASSET_WITH_DETAILS_INCLUDE,
  })
  return asset ? mapAsset(await hydrateAsset(dependencies, asset)) : null
}

export async function findAssetReferenceById(
  dependencies: AssetRepositoryDependencies,
  id: string,
): Promise<AssetReferenceOutput | null> {
  const asset = await dependencies.prisma.inventoryAsset.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, assetNumber: true, name: true, categoryId: true },
  })
  if (!asset) return null

  const category = await dependencies.categoryLookup.findById(asset.categoryId)
  return {
    id: asset.id,
    assetNumber: asset.assetNumber,
    name: asset.name,
    category: category ? mapReference(category) : null,
  }
}

export async function findAssetByCode(
  dependencies: AssetRepositoryDependencies,
  code: string,
  excludeId?: string,
): Promise<AssetRecordOutput | null> {
  const asset = await dependencies.prisma.inventoryAsset.findFirst({
    where: {
      assetNumber: code,
      deletedAt: null,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    include: ASSET_WITH_DETAILS_INCLUDE,
  })
  return asset ? mapAssetRecord(asset) : null
}

export async function countAssetUnits(
  dependencies: AssetRepositoryDependencies,
  id: string,
): Promise<number> {
  return dependencies.prisma.inventoryAssetUnit.count({
    where: { assetId: id, deletedAt: null },
  })
}

export async function findAssetCategoryById(
  dependencies: AssetRepositoryDependencies,
  id: string,
): Promise<AssetCategoryOutput | null> {
  const category = await dependencies.categoryLookup.findById(id)
  return category ? { id: category.id, code: category.code } : null
}

export async function findLatestAssetByPrefix(
  dependencies: AssetRepositoryDependencies,
  prefix: string,
): Promise<AssetLatestOutput | null> {
  const asset = await dependencies.prisma.inventoryAsset.findFirst({
    where: { assetNumber: { startsWith: prefix }, deletedAt: null },
    orderBy: { assetNumber: 'desc' },
    select: { assetNumber: true },
  })
  return asset ? { assetNumber: asset.assetNumber } : null
}

export type {
  AssetCategoryLookupOutput,
  AssetConditionLookupOutput,
  AssetFundingSourceLookupOutput,
  AssetLocationLookupOutput,
}
