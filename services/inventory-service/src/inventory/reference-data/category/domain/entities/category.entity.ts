export interface InventoryCategoryEntity {
  id: string
  code: string
  name: string
  parentId: string | null
  depreciationRatePercent: string
  createdAt: Date
}
