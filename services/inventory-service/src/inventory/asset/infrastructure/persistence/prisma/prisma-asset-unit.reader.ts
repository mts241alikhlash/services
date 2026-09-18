import { Prisma } from '@prisma/client'
import type { PrismaService } from '../../../../../core/database/prisma.service.js'
import type { PaginatedResult } from '../../../../../shared/domain/interfaces/repository.interface.js'
import type {
  AssetUnitCapabilityOutput,
  AssetUnitDetailsCapabilityOutput,
  AssetUnitQueryInput,
  AssetUnitRecordOutput,
  AssetUnitRepositoryOutput,
} from '../../../domain/repositories/asset-unit.repository.js'
import {
  hydrateUnit,
  mapUnitRecord,
  withoutTransactionFlag,
  hydrateCapabilityUnit,
  hydrateDetailsUnit,
  type AssetUnitRepositoryDependencies,
  type UnitRecord,
} from './prisma-asset-unit.mapping.js'
import { ASSET_UNIT_WITH_ASSET_INCLUDE } from './prisma-asset-unit.includes.js'

export type { AssetUnitRepositoryDependencies, UnitRecord }

export async function findAll(
  dependencies: AssetUnitRepositoryDependencies,
  query: AssetUnitQueryInput,
): Promise<PaginatedResult<AssetUnitRepositoryOutput>> {
  const page = Number(query.page ?? 1)
  const limit = Number(query.limit ?? 10)
  const skip = (page - 1) * limit

  const where: Prisma.InventoryAssetUnitWhereInput = { deletedAt: null }
  if (query.lendable) {
    const statusIds =
      await dependencies.statusLookup.findIdsAllowingTransactions()
    where.statusId = { in: statusIds }
  }
  if (query.search?.trim()) {
    const search = query.search.trim()
    where.OR = [
      { unitNumber: { contains: search, mode: 'insensitive' } },
      { asset: { name: { contains: search, mode: 'insensitive' } } },
    ]
  }

  const [units, total] = await Promise.all([
    dependencies.prisma.inventoryAssetUnit.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ asset: { name: 'asc' } }, { unitNumber: 'asc' }],
    }),
    dependencies.prisma.inventoryAssetUnit.count({ where }),
  ])
  const hydrated = await Promise.all(
    units.map((unit) => hydrateUnit(dependencies, unit)),
  )

  return {
    data: hydrated.map(withoutTransactionFlag),
    total,
    page,
    limit,
  }
}

export async function findById(
  dependencies: AssetUnitRepositoryDependencies,
  id: string,
): Promise<AssetUnitRepositoryOutput | null> {
  const unit = await dependencies.prisma.inventoryAssetUnit.findFirst({
    where: { id, deletedAt: null },
  })
  return unit
    ? withoutTransactionFlag(await hydrateUnit(dependencies, unit))
    : null
}

export async function findByUnitCode(
  dependencies: AssetUnitRepositoryDependencies,
  unitCode: string,
  excludeId?: string,
): Promise<AssetUnitRecordOutput | null> {
  const unit = await dependencies.prisma.inventoryAssetUnit.findFirst({
    where: {
      unitNumber: unitCode,
      deletedAt: null,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
  })
  return unit ? mapUnitRecord(unit) : null
}

export async function findByBarcode(
  dependencies: AssetUnitRepositoryDependencies,
  barcode: string,
  excludeId?: string,
): Promise<AssetUnitRecordOutput | null> {
  const unit = await dependencies.prisma.inventoryAssetUnit.findFirst({
    where: {
      barcode,
      deletedAt: null,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
  })
  return unit ? mapUnitRecord(unit) : null
}

export async function findByAsset(
  dependencies: AssetUnitRepositoryDependencies,
  assetId: string,
): Promise<AssetUnitRepositoryOutput[]> {
  const units = await dependencies.prisma.inventoryAssetUnit.findMany({
    where: { assetId, deletedAt: null },
    orderBy: { unitNumber: 'asc' },
  })
  const hydrated = await Promise.all(
    units.map((unit) => hydrateUnit(dependencies, unit)),
  )
  return hydrated.map(withoutTransactionFlag)
}

export async function findByIds(
  dependencies: AssetUnitRepositoryDependencies,
  ids: string[],
): Promise<AssetUnitCapabilityOutput[]> {
  const units = await dependencies.prisma.inventoryAssetUnit.findMany({
    where: { id: { in: ids }, deletedAt: null },
  })
  return Promise.all(
    units.map((unit) => hydrateCapabilityUnit(dependencies, unit)),
  )
}

export async function findLatestUnit(
  dependencies: AssetUnitRepositoryDependencies,
  assetId: string,
): Promise<AssetUnitRecordOutput | null> {
  const unit = await dependencies.prisma.inventoryAssetUnit.findFirst({
    where: { assetId, deletedAt: null },
    orderBy: { unitNumber: 'desc' },
  })
  return unit ? mapUnitRecord(unit) : null
}

export async function findDetailsByIds(
  dependencies: AssetUnitRepositoryDependencies,
  ids: string[],
): Promise<AssetUnitDetailsCapabilityOutput[]> {
  const uniqueIds = [...new Set(ids)]
  if (uniqueIds.length === 0) return []

  const units = await dependencies.prisma.inventoryAssetUnit.findMany({
    where: { id: { in: uniqueIds }, deletedAt: null },
    include: ASSET_UNIT_WITH_ASSET_INCLUDE,
  })
  const hydrated = await Promise.all(
    units.map((unit) => hydrateDetailsUnit(dependencies, unit)),
  )
  const byId = new Map(hydrated.map((unit) => [unit.id, unit]))
  return uniqueIds.flatMap((id) => {
    const unit = byId.get(id)
    return unit ? [unit] : []
  })
}

export async function findLiveIds(
  dependencies: AssetUnitRepositoryDependencies,
  ids?: string[],
): Promise<string[]> {
  if (ids?.length === 0) return []

  const uniqueIds = ids ? [...new Set(ids)] : undefined
  const units = await dependencies.prisma.inventoryAssetUnit.findMany({
    where: {
      deletedAt: null,
      ...(uniqueIds ? { id: { in: uniqueIds } } : {}),
    },
    select: { id: true },
  })
  const liveIds = new Set(units.map(({ id }) => id))
  return uniqueIds
    ? uniqueIds.filter((id) => liveIds.has(id))
    : units.map(({ id }) => id)
}
