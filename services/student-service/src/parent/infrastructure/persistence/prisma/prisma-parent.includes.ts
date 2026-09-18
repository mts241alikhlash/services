import { Prisma } from '@prisma/client'

export const PARENT_LIST_INCLUDE = {} satisfies Prisma.ParentInclude

export const PARENT_DETAIL_INCLUDE = {} satisfies Prisma.ParentInclude

export type ParentWithDetails = Prisma.ParentGetPayload<{
  include: typeof PARENT_DETAIL_INCLUDE
}>

export type ParentListWithDetails = Prisma.ParentGetPayload<{
  include: typeof PARENT_LIST_INCLUDE
}>
