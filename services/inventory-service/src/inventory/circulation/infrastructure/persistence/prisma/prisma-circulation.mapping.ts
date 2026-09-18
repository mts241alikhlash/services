import type { AssetUnitDetailsCapabilityOutput } from '../../../../asset/index.js'
import type {
  HistoryTransactionTypeRepositoryOutput,
  HistoryRepositoryOutput,
} from '../../../domain/repositories/history.repository.js'
import type {
  LoanDetailsCapabilityOutput,
  LoanItemUnitRepositoryOutput,
  LoanRepositoryOutput,
} from '../../../domain/repositories/loan.repository.js'
import type { LoanDetailsRecord } from './prisma-circulation.includes.js'

export interface LoanRecord {
  id: string
  loanNumber: string
  requesterId: string
  expectedReturnDate: Date
  actualReturnDate: Date | null
  purpose: string
  statusId: string
  workflowInstanceId: string | null
  createdAt: Date
  updatedAt: Date
  items?: LoanItemRecord[]
}

export interface LoanItemRecord {
  id: string
  loanId: string
  unitId: string
  returnedConditionId: string | null
  notes: string | null
}

export interface HistoryRecord {
  id: string
  unitId: string
  transactionTypeId: string
  previousConditionId: string | null
  newConditionId: string | null
  previousStatusId: string | null
  newStatusId: string | null
  previousLocationId: string | null
  newLocationId: string | null
  previousCustodianId: string | null
  newCustodianId: string | null
  note: string | null
  changedById: string
  changedAt: Date
  transactionType?: HistoryTransactionTypeRepositoryOutput
}

function mapUnit(
  unit: AssetUnitDetailsCapabilityOutput,
): LoanItemUnitRepositoryOutput {
  return {
    id: unit.id,
    assetId: unit.assetId,
    unitNumber: unit.unitNumber,
    barcode: unit.barcode,
    currentBookValue: unit.currentBookValue,
    conditionId: unit.conditionId,
    statusId: unit.statusId,
    locationId: unit.locationId,
    custodianId: unit.custodianId,
    notes: unit.notes,
    version: unit.version,
    createdAt: unit.createdAt,
    updatedAt: unit.updatedAt,
    deletedAt: unit.deletedAt,
    ...(unit.asset && { asset: unit.asset }),
    ...(unit.location && { location: unit.location }),
    ...(unit.status && { status: unit.status }),
    ...(unit.condition && { condition: unit.condition }),
  }
}

function mapLoanItem(
  item: LoanItemRecord,
  unitsById: Map<string, AssetUnitDetailsCapabilityOutput>,
) {
  const unit = unitsById.get(item.unitId)
  return {
    id: item.id,
    loanId: item.loanId,
    unitId: item.unitId,
    returnedConditionId: item.returnedConditionId,
    note: item.notes,
    ...(unit && { unit: mapUnit(unit) }),
  }
}

export function mapLoan(
  loan: LoanRecord,
  unitsById = new Map<string, AssetUnitDetailsCapabilityOutput>(),
): LoanRepositoryOutput {
  return {
    id: loan.id,
    loanNumber: loan.loanNumber,
    requesterId: loan.requesterId,
    expectedReturnDate: loan.expectedReturnDate,
    actualReturnDate: loan.actualReturnDate,
    purpose: loan.purpose,
    statusId: loan.statusId,
    workflowInstanceId: loan.workflowInstanceId,
    ...(loan.items && {
      items: loan.items.map((item) => mapLoanItem(item, unitsById)),
    }),
    createdAt: loan.createdAt,
    updatedAt: loan.updatedAt,
  }
}

export function mapLoanDetails(
  loan: LoanDetailsRecord,
  unitsById: Map<string, AssetUnitDetailsCapabilityOutput>,
): LoanDetailsCapabilityOutput {
  return {
    id: loan.id,
    loanNumber: loan.loanNumber,
    purpose: loan.purpose,
    expectedReturnDate: loan.expectedReturnDate,
    items: loan.items.map((item) => {
      const unit = unitsById.get(item.unitId)
      return {
        id: item.id,
        unitId: item.unitId,
        unit: unit
          ? {
              id: unit.id,
              unitNumber: unit.unitNumber,
              asset: unit.asset
                ? { id: unit.asset.id, name: unit.asset.name }
                : null,
            }
          : null,
      }
    }),
  }
}

export function mapHistory(
  history: HistoryRecord,
  unitsById = new Map<string, AssetUnitDetailsCapabilityOutput>(),
): HistoryRepositoryOutput {
  const unit = unitsById.get(history.unitId)
  return {
    id: history.id,
    unitId: history.unitId,
    transactionTypeId: history.transactionTypeId,
    previousConditionId: history.previousConditionId,
    newConditionId: history.newConditionId,
    previousStatusId: history.previousStatusId,
    newStatusId: history.newStatusId,
    previousLocationId: history.previousLocationId,
    newLocationId: history.newLocationId,
    previousCustodianId: history.previousCustodianId,
    newCustodianId: history.newCustodianId,
    note: history.note,
    changedById: history.changedById,
    changedAt: history.changedAt,
    ...(unit && { unit: mapUnit(unit) }),
    ...(history.transactionType && {
      transactionType: mapTransactionTypeDetails(history.transactionType),
    }),
  }
}

function mapTransactionTypeDetails(
  transactionType: HistoryTransactionTypeRepositoryOutput,
): HistoryTransactionTypeRepositoryOutput {
  return {
    id: transactionType.id,
    code: transactionType.code,
    name: transactionType.name,
    direction: transactionType.direction,
    description: transactionType.description,
    createdAt: transactionType.createdAt,
  }
}

export function mapTransactionType(transactionType: {
  id: string
  code: string
  name: string
}): { id: string; code: string; name: string } {
  return {
    id: transactionType.id,
    code: transactionType.code,
    name: transactionType.name,
  }
}
