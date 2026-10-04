export type RegionLevelName = 'PROVINCE' | 'REGENCY' | 'DISTRICT' | 'VILLAGE'

export interface RegionEntity {
  code: string
  name: string
  level: RegionLevelName
  parentCode: string | null
}

export abstract class IRegionRepository {
  abstract findProvinces(): Promise<RegionEntity[]>
  abstract findChildren(parentCode: string): Promise<RegionEntity[]>
  abstract findByCodes(codes: string[]): Promise<RegionEntity[]>
}
