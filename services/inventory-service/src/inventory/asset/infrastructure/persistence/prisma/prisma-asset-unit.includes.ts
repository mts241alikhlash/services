import { Prisma } from '@prisma/client'

export const ASSET_UNIT_WITH_ASSET_INCLUDE = {
  asset: true,
} satisfies Prisma.InventoryAssetUnitInclude

export type AssetUnitWithAsset = Prisma.InventoryAssetUnitGetPayload<{
  include: typeof ASSET_UNIT_WITH_ASSET_INCLUDE
}>
