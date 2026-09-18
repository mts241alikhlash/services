import type {
  PaginatedResult,
  PaginationQueryInput,
} from '../../../../shared/domain/interfaces/repository.interface.js'
import type { LoanItemUnitRepositoryOutput } from './loan.repository.js'

export interface HistoryTransactionTypeRepositoryOutput {
  id: string
  code: string
  name: string
  direction: string
  description?: string | null
  createdAt: Date
}

export interface HistoryRepositoryOutput {
  id: string
  unitId: string
  transactionTypeId: string
  previousConditionId?: string | null
  newConditionId?: string | null
  previousStatusId?: string | null
  newStatusId?: string | null
  previousLocationId?: string | null
  newLocationId?: string | null
  previousCustodianId?: string | null
  newCustodianId?: string | null
  note?: string | null
  changedById: string
  changedAt: Date
  unit?: LoanItemUnitRepositoryOutput
  transactionType?: HistoryTransactionTypeRepositoryOutput
}

export interface HistoryQueryInput extends PaginationQueryInput {
  unitId?: string
}

export interface CreateHistoryRepositoryInput {
  unitId: string
  transactionTypeId: string
  previousConditionId?: string | null
  newConditionId?: string | null
  previousStatusId?: string | null
  newStatusId?: string | null
  previousLocationId?: string | null
  newLocationId?: string | null
  previousCustodianId?: string | null
  newCustodianId?: string | null
  note?: string | null
  changedById: string
}

export interface RecordHistoryCapabilityInput {
  unitId: string
  transactionTypeId: string
  previousStatusId?: string | null
  newStatusId: string
  note: string
  changedById: string
  operationKey?: string
}

export abstract class IHistoryRepository {
  abstract findAllHistories(
    query: HistoryQueryInput,
  ): Promise<PaginatedResult<HistoryRepositoryOutput>>
  abstract createHistory(
    input: CreateHistoryRepositoryInput,
  ): Promise<HistoryRepositoryOutput>
}

export abstract class IHistoryCapabilityPort {
  abstract record(input: RecordHistoryCapabilityInput): Promise<void>
}
