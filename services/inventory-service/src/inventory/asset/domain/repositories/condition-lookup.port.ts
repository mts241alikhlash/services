export interface AssetConditionLookupOutput {
  id: string
  code: string
  name: string
  isUsable: boolean
  createdAt: Date
}

export abstract class IAssetConditionLookupPort {
  abstract findById(id: string): Promise<AssetConditionLookupOutput | null>
}
