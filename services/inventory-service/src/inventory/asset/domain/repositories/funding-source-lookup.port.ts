export interface AssetFundingSourceLookupOutput {
  id: string
  code: string
  name: string
}

export abstract class IAssetFundingSourceLookupPort {
  abstract findById(id: string): Promise<AssetFundingSourceLookupOutput | null>
}
