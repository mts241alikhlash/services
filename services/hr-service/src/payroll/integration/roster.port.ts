export interface RosterMember {
  userId: string
  displayName: string | null
}

export abstract class IPayrollRosterPort {
  abstract listActiveEmployees(): Promise<RosterMember[]>
}
