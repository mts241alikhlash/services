export interface NamedRef {
  id: string
  name: string
}

export abstract class IReferenceLookupPort {
  abstract listAcademicYears(ids: string[]): Promise<NamedRef[]>
  abstract listOccupations(ids: string[]): Promise<NamedRef[]>
  abstract listEducations(ids: string[]): Promise<NamedRef[]>

  abstract listReligions(ids: string[]): Promise<NamedRef[]>
}
