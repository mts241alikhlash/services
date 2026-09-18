import { InventoryStatusKey } from '../../../../../../shared/domain/enums/inventory-status-key.enum.js'

export interface CreateStatusInput {
  code: string
  name: string
  allowTransactions?: boolean
  systemKey?: InventoryStatusKey | null
}
