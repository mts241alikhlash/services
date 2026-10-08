import type { OptionListKey, OptionRef } from './option-lists.js'

export interface NamedRef {
  id: string
  name: string
}

export interface GradeRef {
  id: string
  level: number
  name: string | null
}

export abstract class IReferenceLookupPort {
  abstract listAcademicYears(ids: string[]): Promise<NamedRef[]>
  abstract listOccupations(ids: string[]): Promise<NamedRef[]>
  abstract listEducations(ids: string[]): Promise<NamedRef[]>

  abstract listReligions(ids: string[]): Promise<NamedRef[]>
  abstract activeReligions(): Promise<OptionRef[]>
  abstract activeGrades(): Promise<GradeRef[]>
  abstract listGrades(ids: string[]): Promise<GradeRef[]>
  abstract activeOptions(key: OptionListKey): Promise<OptionRef[]>
  abstract optionsByIds(key: OptionListKey, ids: string[]): Promise<OptionRef[]>
}
