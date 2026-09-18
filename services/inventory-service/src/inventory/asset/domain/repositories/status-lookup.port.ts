export interface AssetStatusLookupOutput {
  id: string
  code: string
  name: string
  allowTransactions: boolean
  systemKey: string | null
  createdAt: Date
}

export abstract class IAssetStatusLookupPort {
  abstract findById(id: string): Promise<AssetStatusLookupOutput | null>
  abstract findIdsAllowingTransactions(): Promise<string[]>
}
