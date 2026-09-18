import { Prisma } from '@prisma/client'

export const LOAN_WITH_DETAILS_INCLUDE = {
  items: true,
} satisfies Prisma.InventoryLoanInclude

export type LoanWithDetails = Prisma.InventoryLoanGetPayload<{
  include: typeof LOAN_WITH_DETAILS_INCLUDE
}>

export const LOAN_DETAILS_INCLUDE = {
  items: {
    select: { id: true, unitId: true },
  },
} satisfies Prisma.InventoryLoanInclude

export type LoanDetailsRecord = Prisma.InventoryLoanGetPayload<{
  include: typeof LOAN_DETAILS_INCLUDE
}>

export const HISTORY_WITH_TRANSACTION_TYPE_INCLUDE = {
  transactionType: true,
} satisfies Prisma.InventoryHistoryInclude

export type HistoryWithTransactionType = Prisma.InventoryHistoryGetPayload<{
  include: typeof HISTORY_WITH_TRANSACTION_TYPE_INCLUDE
}>
