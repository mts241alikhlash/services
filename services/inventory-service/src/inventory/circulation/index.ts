export {
  ILoanRepository,
  ILoanCapabilityPort,
  ILoanItemCapabilityPort,
  type CreateLoanRepositoryInput,
  type LoanItemCapabilityOutput,
  type LoanItemRepositoryOutput,
  type LoanItemUnitRepositoryOutput,
  type LoanDetailsCapabilityOutput,
  type LoanQueryInput,
  type LoanRepositoryOutput,
  type LoanStatusCapabilityOutput,
  type ProcessCreateLoanInput,
  type ProcessReturnLoanInput,
  type ProcessReturnLoanItemInput,
  type UpdateLoanRepositoryInput,
} from './domain/repositories/loan.repository.js'
export {
  IHistoryRepository,
  IHistoryCapabilityPort,
  type CreateHistoryRepositoryInput,
  type HistoryQueryInput,
  type HistoryRepositoryOutput,
  type HistoryTransactionTypeRepositoryOutput,
  type RecordHistoryCapabilityInput,
} from './domain/repositories/history.repository.js'
export {
  ITransactionTypeRepository,
  ITransactionTypeCapabilityPort,
  type TransactionTypeCapabilityOutput,
  type TransactionTypeRepositoryOutput,
} from './domain/repositories/transaction-type.repository.js'
export {
  ICirculationCapabilitiesRepository,
  type InventoryStatusRow,
  type LoanableUnitRow,
} from './domain/repositories/circulation-capabilities.repository.js'
