export interface AssetLocationLookupOutput {
  id: string
  code: string
  name: string
  building: string | null
  room: string | null
  rack: string | null
  description: string | null
  createdAt: Date
}

export abstract class IAssetLocationLookupPort {
  abstract findById(id: string): Promise<AssetLocationLookupOutput | null>
}
