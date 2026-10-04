export interface RegionRef {
  code: string
  name: string
  level: 'PROVINCE' | 'REGENCY' | 'DISTRICT' | 'VILLAGE'
  parentCode: string | null
}

export abstract class IRegionLookupPort {
  abstract byCodes(codes: string[]): Promise<RegionRef[]>
}
