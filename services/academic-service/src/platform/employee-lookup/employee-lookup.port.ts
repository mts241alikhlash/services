export interface EmployeeRef {
  id: string
  userId: string
  nip: string | null
}

export abstract class IEmployeeLookupPort {
  abstract listByIds(ids: string[]): Promise<EmployeeRef[]>
}
