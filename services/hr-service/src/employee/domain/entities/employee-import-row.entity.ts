export interface EmployeeImportRow {
  identifier: string
  password: string
  name: string
  nik: string
  gender?: string
  birthPlace: string
  birthDate: string
  email?: string
  phone?: string
  nip?: string
  nuptk?: string
  employmentTypeCode: string
}

export type EmployeeImportRowEntity = EmployeeImportRow
