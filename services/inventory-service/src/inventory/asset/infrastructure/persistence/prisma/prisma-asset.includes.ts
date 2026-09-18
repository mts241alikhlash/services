import { Prisma } from '@prisma/client'

export const ASSET_WITH_DETAILS_INCLUDE = {
  units: {
    where: { deletedAt: null },
  },
  _count: {
    select: {
      units: { where: { deletedAt: null } },
    },
  },
} satisfies Prisma.InventoryAssetInclude

export type AssetWithDetails = Prisma.InventoryAssetGetPayload<{
  include: typeof ASSET_WITH_DETAILS_INCLUDE
}>
