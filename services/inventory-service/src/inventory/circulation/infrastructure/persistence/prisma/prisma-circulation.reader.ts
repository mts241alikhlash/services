import { Prisma } from '@prisma/client'
import type { PrismaService } from '../../../../../core/database/prisma.service.js'
import type { PaginatedResult } from '../../../../../shared/domain/interfaces/repository.interface.js'
import type {
  AssetUnitDetailsCapabilityOutput,
  IAssetUnitDetailsCapabilityPort,
} from '../../../../asset/index.js'
import type {
  HistoryQueryInput,
  HistoryRepositoryOutput,
} from '../../../domain/repositories/history.repository.js'
import type {
  LoanDetailsCapabilityOutput,
  LoanItemCapabilityOutput,
  LoanQueryInput,
  LoanRepositoryOutput,
} from '../../../domain/repositories/loan.repository.js'
import {
  HISTORY_WITH_TRANSACTION_TYPE_INCLUDE,
  LOAN_DETAILS_INCLUDE,
  LOAN_WITH_DETAILS_INCLUDE,
  type HistoryWithTransactionType,
  type LoanDetailsRecord,
} from './prisma-circulation.includes.js'
import {
  mapHistory,
  mapLoan,
  mapLoanDetails,
} from './prisma-circulation.mapping.js'

export interface ReaderDependencies {
  prisma: PrismaService
  unitDetails: IAssetUnitDetailsCapabilityPort
}

function unitIdsFromLoans(loans: { items?: { unitId: string }[] }[]) {
  return [
    ...new Set(
      loans.flatMap((loan) => (loan.items ?? []).map((item) => item.unitId)),
    ),
  ]
}

async function loadUnitDetails(
  unitDetails: IAssetUnitDetailsCapabilityPort,
  ids: string[],
): Promise<Map<string, AssetUnitDetailsCapabilityOutput>> {
  if (ids.length === 0) {
    return new Map<string, AssetUnitDetailsCapabilityOutput>()
  }
  const units = await unitDetails.findDetailsByIds(ids)
  return new Map(units.map((unit) => [unit.id, unit]))
}

function loanWhere(query: LoanQueryInput): Prisma.InventoryLoanWhereInput {
  const where: Prisma.InventoryLoanWhereInput = {}
  if (query.statusId && query.statusId !== 'all') {
    where.statusId = query.statusId
  }
  if (query.requesterId) where.requesterId = query.requesterId
  if (query.keyword && query.keyword.trim() !== '') {
    where.OR = [
      { loanNumber: { contains: query.keyword, mode: 'insensitive' } },
      { purpose: { contains: query.keyword, mode: 'insensitive' } },
    ]
  }
  return where
}

export async function findAllLoans(
  dependencies: ReaderDependencies,
  query: LoanQueryInput,
): Promise<PaginatedResult<LoanRepositoryOutput>> {
  const { page = 1, limit = 10 } = query
  const where = loanWhere(query)
  const [data, total] = await Promise.all([
    dependencies.prisma.inventoryLoan.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: LOAN_WITH_DETAILS_INCLUDE,
    }),
    dependencies.prisma.inventoryLoan.count({ where }),
  ])
  const unitsById = await loadUnitDetails(
    dependencies.unitDetails,
    unitIdsFromLoans(data),
  )
  return {
    data: data.map((loan) => mapLoan(loan, unitsById)),
    total,
    page,
    limit,
  }
}

export async function findLoanById(
  dependencies: ReaderDependencies,
  id: string,
): Promise<LoanRepositoryOutput | null> {
  const loan = await dependencies.prisma.inventoryLoan.findUnique({
    where: { id },
    include: LOAN_WITH_DETAILS_INCLUDE,
  })
  if (!loan) return null
  const unitsById = await loadUnitDetails(
    dependencies.unitDetails,
    unitIdsFromLoans([loan]),
  )
  return mapLoan(loan, unitsById)
}

export async function findLoanDetailsByIds(
  dependencies: ReaderDependencies,
  ids: string[],
): Promise<LoanDetailsCapabilityOutput[]> {
  const uniqueIds = [...new Set(ids)]
  if (uniqueIds.length === 0) return []
  const loans = await dependencies.prisma.inventoryLoan.findMany({
    where: { id: { in: uniqueIds } },
    include: LOAN_DETAILS_INCLUDE,
  })
  const unitsById = await loadUnitDetails(
    dependencies.unitDetails,
    unitIdsFromLoans(loans),
  )
  const loansById = new Map(loans.map((loan) => [loan.id, loan]))
  return uniqueIds.flatMap((id) => {
    const loan = loansById.get(id)
    return loan ? [mapLoanDetails(loan, unitsById)] : []
  })
}

export async function findLoanItemUnitIds(
  dependencies: ReaderDependencies,
  loanId: string,
): Promise<LoanItemCapabilityOutput[]> {
  const items = await dependencies.prisma.inventoryLoanItem.findMany({
    where: { loanId },
    select: { unitId: true },
  })
  const liveIds = new Set(
    await dependencies.unitDetails.findLiveIds(
      items.map(({ unitId }) => unitId),
    ),
  )
  return items
    .filter(({ unitId }) => liveIds.has(unitId))
    .map(({ unitId }) => ({ unitId }))
}

export async function findAllHistories(
  dependencies: ReaderDependencies,
  query: HistoryQueryInput,
): Promise<PaginatedResult<HistoryRepositoryOutput>> {
  const { page = 1, limit = 10, unitId } = query
  const liveIds = await dependencies.unitDetails.findLiveIds(
    unitId ? [unitId] : undefined,
  )
  const where: Prisma.InventoryHistoryWhereInput = {
    unitId: { in: liveIds },
  }
  const [data, total] = await Promise.all([
    dependencies.prisma.inventoryHistory.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { changedAt: 'desc' },
      include: HISTORY_WITH_TRANSACTION_TYPE_INCLUDE,
    }),
    dependencies.prisma.inventoryHistory.count({ where }),
  ])
  const unitsById = await loadUnitDetails(dependencies.unitDetails, [
    ...new Set(data.map((history) => history.unitId)),
  ])
  return {
    data: data.map((history) => mapHistory(history, unitsById)),
    total,
    page,
    limit,
  }
}

export type { LoanDetailsRecord }
