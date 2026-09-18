export interface InventoryStatusRow {
  id: string
  code: string
  name: string
  systemKey?: string | null
  allowTransactions: boolean
}

export interface LoanableUnitRow {
  id: string
  unitNumber: string
  statusId: string
  asset: {
    name: string
  }
  status: {
    allowTransactions: boolean
  } | null
}

export abstract class ICirculationCapabilitiesRepository {
  abstract findStatusByCode(code: string): Promise<InventoryStatusRow | null>
  abstract findStatusBySystemKey(
    systemKey: string,
  ): Promise<InventoryStatusRow | null>
  abstract findUnitsByIds(ids: string[]): Promise<LoanableUnitRow[]>
}
