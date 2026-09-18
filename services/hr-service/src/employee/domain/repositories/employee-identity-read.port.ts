export interface EmployeeRefRow {
  id: string
  userId: string
  nip: string | null
}

export abstract class IEmployeeIdentityReadPort {
  abstract listRefsByIds(ids: string[]): Promise<EmployeeRefRow[]>

  abstract findEmployeeIdByUserId(userId: string): Promise<string | null>

  abstract employeeExists(id: string): Promise<boolean>

  abstract listRosterUserIds(): Promise<string[]>
}
