export interface InventoryFundingSourceEntity {
  id: string
  code: string
  name: string
  description: string | null
  createdAt: Date
  deletedAt?: Date | null
}
