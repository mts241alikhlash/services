import { InventoryStatusKey } from '../../../../../shared/domain/enums/inventory-status-key.enum.js'

export interface StatusCreateRepositoryInput {
  code: string
  name: string
  allowTransactions?: boolean
  systemKey?: `${InventoryStatusKey}` | null
}

export interface StatusUpdateRepositoryInput {
  code?: string
  name?: string
  allowTransactions?: boolean
  systemKey?: `${InventoryStatusKey}` | null
}

export interface StatusRepositoryOutput {
  id: string
  code: string
  name: string
  allowTransactions: boolean
  systemKey: InventoryStatusKey | null
  createdAt: Date
}

export abstract class IStatusRepository {
  abstract findMany(search?: string): Promise<StatusRepositoryOutput[]>
  abstract findById(id: string): Promise<StatusRepositoryOutput | null>
  abstract create(
    data: StatusCreateRepositoryInput,
  ): Promise<StatusRepositoryOutput>
  abstract update(
    id: string,
    data: StatusUpdateRepositoryInput,
  ): Promise<StatusRepositoryOutput>
  abstract delete(id: string): Promise<StatusRepositoryOutput>
  abstract findBySystemKey(key: string): Promise<{ id: string } | null>
}
