export interface AssetCategoryLookupOutput {
  id: string
  code: string
  name: string
}

export abstract class IAssetCategoryLookupPort {
  abstract findById(id: string): Promise<AssetCategoryLookupOutput | null>
}
