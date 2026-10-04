export interface TransactionTypeRepositoryOutput {
  id: string
  code: string
  name: string
  direction?: string
  description?: string | null
  createdAt?: Date
}

export interface TransactionTypeCapabilityOutput {
  id: string
}

export abstract class ITransactionTypeRepository {
  abstract findTransactionTypeByCode(
    code: string,
  ): Promise<TransactionTypeRepositoryOutput | null>
}

export abstract class ITransactionTypeCapabilityPort {
  abstract findTransactionTypeByCode(
    code: string,
  ): Promise<TransactionTypeCapabilityOutput | null>
}
