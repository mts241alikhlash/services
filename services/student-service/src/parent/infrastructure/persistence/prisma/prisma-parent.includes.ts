import { Prisma } from '../../../../generated/prisma/client.js'

export const PARENT_LIST_INCLUDE = {
  _count: { select: { studentParents: { where: { deletedAt: null } } } },
} satisfies Prisma.ParentInclude

export const PARENT_DETAIL_INCLUDE = {} satisfies Prisma.ParentInclude

export type ParentWithDetails = Prisma.ParentGetPayload<{
  include: typeof PARENT_DETAIL_INCLUDE
}>

export type ParentListWithDetails = Prisma.ParentGetPayload<{
  include: typeof PARENT_LIST_INCLUDE
}>
