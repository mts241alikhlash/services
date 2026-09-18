import { Prisma } from '@prisma/client'
import type {
  AssetRecordOutput,
  AssetRepositoryOutput,
  CreateAssetRepositoryInput,
  UpdateAssetRepositoryInput,
} from '../../../domain/repositories/asset.repository.js'
import { ASSET_WITH_DETAILS_INCLUDE } from './prisma-asset.includes.js'
import {
  hydrateAsset,
  type AssetRepositoryDependencies,
} from './prisma-asset.reader.js'
import { mapAsset, mapAssetRecord } from './prisma-asset.mapping.js'
import { toNumericValue } from '../../../../../shared/domain/types/decimal.type.js'

export async function createAsset(
  dependencies: AssetRepositoryDependencies,
  input: CreateAssetRepositoryInput,
): Promise<AssetRepositoryOutput> {
  const { categoryId, fundingSourceId, units, ...scalars } = input
  const data: Prisma.InventoryAssetUncheckedCreateInput = {
    ...scalars,
    categoryId,
    ...(fundingSourceId !== undefined && { fundingSourceId }),
    units: {
      create: units.map(
        ({ conditionId, statusId, locationId, ...unitScalars }) => ({
          ...unitScalars,
          currentBookValue: toNumericValue(unitScalars.currentBookValue),
          conditionId,
          statusId,
          locationId,
        }),
      ),
    },
  }
  const asset = await dependencies.prisma.inventoryAsset.create({
    data,
    include: ASSET_WITH_DETAILS_INCLUDE,
  })
  return mapAsset(await hydrateAsset(dependencies, asset))
}

export async function updateAsset(
  dependencies: AssetRepositoryDependencies,
  id: string,
  input: UpdateAssetRepositoryInput,
): Promise<AssetRepositoryOutput> {
  const { categoryId, fundingSourceId, ...scalars } = input
  const data: Prisma.InventoryAssetUncheckedUpdateInput = {
    ...scalars,
    ...(categoryId && { categoryId }),
    ...(fundingSourceId !== undefined && { fundingSourceId }),
  }
  const asset = await dependencies.prisma.inventoryAsset.update({
    where: { id },
    data,
    include: ASSET_WITH_DETAILS_INCLUDE,
  })
  return mapAsset(await hydrateAsset(dependencies, asset))
}

export async function removeAsset(
  dependencies: AssetRepositoryDependencies,
  id: string,
): Promise<AssetRecordOutput> {
  const asset = await dependencies.prisma.inventoryAsset.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
  return mapAssetRecord(asset)
}

export async function softDeleteAsset(
  dependencies: AssetRepositoryDependencies,
  id: string,
): Promise<AssetRecordOutput> {
  const asset = await dependencies.prisma.inventoryAsset.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
  return mapAssetRecord(asset)
}
