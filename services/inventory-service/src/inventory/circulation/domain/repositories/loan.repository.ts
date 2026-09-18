import type {
  PaginatedResult,
  PaginationQueryInput,
} from '../../../../shared/domain/interfaces/repository.interface.js'
import type { DecimalValue } from '../../../../shared/domain/types/decimal.type.js'
import type { InventoryStatusRow } from './circulation-capabilities.repository.js'

export interface LoanItemUnitRepositoryOutput {
  id: string
  assetId: string
  unitNumber: string
  barcode?: string | null
  currentBookValue: DecimalValue
  conditionId: string
  statusId: string
  locationId: string
  custodianId?: string | null
  notes?: string | null
  version: number
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
  asset?: {
    id: string
    assetNumber: string
    name: string
    categoryId: string
    brand?: string | null
    model?: string | null
    purchaseDate: Date
    purchasePrice: DecimalValue
    usefulLifeMonths: number
    fundingSourceId?: string | null
    imageUrl?: string | null
    notes?: string | null
    version: number
    createdAt: Date
    updatedAt: Date
    deletedAt?: Date | null
  }
  location?: {
    id: string
    code: string
    name: string
    building?: string | null
    room?: string | null
    rack?: string | null
    description?: string | null
    createdAt: Date
  }
  status?: {
    id: string
    code: string
    name: string
    allowTransactions: boolean
    systemKey?: string | null
    createdAt: Date
  }
  condition?: {
    id: string
    code: string
    name: string
    isUsable: boolean
    createdAt: Date
  }
}

export interface LoanItemRepositoryOutput {
  id: string
  loanId: string
  unitId: string
  returnedConditionId?: string | null
  note?: string | null
  unit?: LoanItemUnitRepositoryOutput
}

export interface LoanItemCapabilityOutput {
  unitId: string
}

export interface LoanStatusCapabilityOutput {
  id: string
  loanNumber: string
}

export interface LoanDetailsCapabilityOutput {
  id: string
  loanNumber: string
  purpose?: string | null
  expectedReturnDate?: Date | null
  items: {
    id: string
    unitId: string
    unit?: {
      id: string
      unitNumber: string
      asset?: { id: string; name: string } | null
    } | null
  }[]
}

export interface LoanRequesterRepositoryOutput {
  id: string
  identifier: string
}

export interface LoanRepositoryOutput {
  id: string
  loanNumber: string
  requesterId: string
  expectedReturnDate: Date
  actualReturnDate?: Date | null
  purpose: string
  statusId: string
  workflowInstanceId?: string | null
  status?: InventoryStatusRow | null
  items?: LoanItemRepositoryOutput[]
  requester?: LoanRequesterRepositoryOutput | null
  createdAt?: Date
  updatedAt?: Date
}

export interface LoanQueryInput extends PaginationQueryInput {
  keyword?: string
  statusId?: string
  requesterId?: string
}

export interface CreateLoanRepositoryInput {
  loanNumber: string
  requesterId: string
  expectedReturnDate: Date
  purpose: string
  statusId: string
  workflowInstanceId?: string | null
}

export interface UpdateLoanRepositoryInput {
  expectedReturnDate?: Date
  actualReturnDate?: Date | null
  purpose?: string
  statusId?: string
  workflowInstanceId?: string | null
}

export interface ProcessCreateLoanInput {
  loanNumber: string
  requesterId: string
  expectedReturnDate: Date
  purpose: string
  pendingStatusId: string
  unitIds: string[]
}

export interface ProcessReturnLoanItemInput {
  unitId: string
  conditionId: string
  note?: string
}

export interface ProcessReturnLoanInput {
  loanId: string
  returnedStatusId: string
}

export abstract class ILoanRepository {
  abstract findAllLoans(
    query: LoanQueryInput,
  ): Promise<PaginatedResult<LoanRepositoryOutput>>
  abstract findLoanById(id: string): Promise<LoanRepositoryOutput | null>
  abstract createLoan(
    input: CreateLoanRepositoryInput,
  ): Promise<LoanRepositoryOutput>
  abstract updateLoan(
    id: string,
    input: UpdateLoanRepositoryInput,
  ): Promise<LoanRepositoryOutput>
  abstract findLatestLoan(): Promise<LoanRepositoryOutput | null>
  abstract processCreateLoanTransaction(
    input: ProcessCreateLoanInput,
  ): Promise<LoanRepositoryOutput>
  abstract processReturnLoanTransaction(
    input: ProcessReturnLoanInput,
  ): Promise<LoanRepositoryOutput>
}

export abstract class ILoanCapabilityPort {
  abstract findDetailsByIds(
    ids: string[],
  ): Promise<LoanDetailsCapabilityOutput[]>
  abstract updateStatus(
    id: string,
    statusId: string,
  ): Promise<LoanStatusCapabilityOutput>
}

export abstract class ILoanItemCapabilityPort {
  abstract findByLoanId(loanId: string): Promise<LoanItemCapabilityOutput[]>
}
