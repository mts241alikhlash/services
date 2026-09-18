export interface SchoolUnitProfile {
  name: string
  email: string | null
  phone: string | null
}

export abstract class ISchoolUnitIdentityReadPort {
  abstract findSchoolUnitProfile(): Promise<SchoolUnitProfile | null>
}
