export interface CreateAssetInput {
  name: string
  quantity?: number
  categoryId: string
  brand?: string
  model?: string
  barcode?: string
  assetNumber?: string
  purchaseDate: string
  purchasePrice: number
  usefulLifeMonths?: number
  fundingSourceId?: string
  locationId: string
  statusId: string
  conditionId: string
  notes?: string
}
