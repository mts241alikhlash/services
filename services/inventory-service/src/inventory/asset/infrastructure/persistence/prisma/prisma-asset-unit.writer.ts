import { Prisma } from '@prisma/client'
import { toNumericValue } from '../../../../../shared/domain/types/decimal.type.js'
import type {
  AssetUnitRepositoryOutput,
  CreateAssetUnitRepositoryInput,
  UpdateAssetUnitConditionRepositoryInput,
  UpdateAssetUnitRepositoryInput,
  UpdateAssetUnitStatusesRepositoryInput,
  AssetUnitRecordOutput,
} from '../../../domain/repositories/asset-unit.repository.js'
import {
  hydrateUnit,
  mapUnitRecord,
  withoutTransactionFlag,
  type AssetUnitRepositoryDependencies,
} from './prisma-asset-unit.mapping.js'

export async function create(
  dependencies: AssetUnitRepositoryDependencies,
  input: CreateAssetUnitRepositoryInput,
): Promise<AssetUnitRepositoryOutput> {
  const unit = await dependencies.prisma.inventoryAssetUnit.create({
    data: {
      ...input,
      currentBookValue: toNumericValue(input.currentBookValue),
    },
  })
  return withoutTransactionFlag(await hydrateUnit(dependencies, unit))
}

export async function createMany(
  dependencies: AssetUnitRepositoryDependencies,
  inputs: CreateAssetUnitRepositoryInput[],
): Promise<number> {
  const result = await dependencies.prisma.inventoryAssetUnit.createMany({
    data: inputs.map((row) => ({
      ...row,
      currentBookValue: toNumericValue(row.currentBookValue),
    })),
  })
  return result.count
}

export async function update(
  dependencies: AssetUnitRepositoryDependencies,
  id: string,
  input: UpdateAssetUnitRepositoryInput,
): Promise<AssetUnitRepositoryOutput> {
  const { conditionId, statusId, locationId, ...scalars } = input
  const data: Prisma.InventoryAssetUnitUncheckedUpdateInput = {
    ...scalars,
    ...(conditionId && { conditionId }),
    ...(statusId && { statusId }),
    ...(locationId && { locationId }),
  }
  const unit = await dependencies.prisma.inventoryAssetUnit.update({
    where: { id },
    data,
  })
  return withoutTransactionFlag(await hydrateUnit(dependencies, unit))
}

export async function remove(
  dependencies: AssetUnitRepositoryDependencies,
  id: string,
): Promise<AssetUnitRecordOutput> {
  const unit = await dependencies.prisma.inventoryAssetUnit.delete({
    where: { id },
  })
  return mapUnitRecord(unit)
}

export async function softDelete(
  dependencies: AssetUnitRepositoryDependencies,
  id: string,
): Promise<AssetUnitRecordOutput> {
  const unit = await dependencies.prisma.inventoryAssetUnit.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
  return mapUnitRecord(unit)
}

export async function updateStatuses(
  dependencies: AssetUnitRepositoryDependencies,
  input: UpdateAssetUnitStatusesRepositoryInput,
): Promise<void> {
  await dependencies.prisma.inventoryAssetUnit.updateMany({
    where: { id: { in: input.unitIds } },
    data: { statusId: input.statusId },
  })
}

export async function updateCondition(
  dependencies: AssetUnitRepositoryDependencies,
  input: UpdateAssetUnitConditionRepositoryInput,
): Promise<void> {
  await dependencies.prisma.inventoryAssetUnit.update({
    where: { id: input.unitId },
    data: { conditionId: input.conditionId },
  })
}
