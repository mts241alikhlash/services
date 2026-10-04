import { InventoryStatusKey } from '../../../../../../shared/domain/enums/inventory-status-key.enum.js'

export interface UpdateStatusInput {
  code?: string
  name?: string
  allowTransactions?: boolean
  systemKey?: InventoryStatusKey | null
}
