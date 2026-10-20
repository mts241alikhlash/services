export type DocumentRequirement = 'REQUIRED' | 'LATER' | 'OPTIONAL'

export interface AdmissionDocumentTypeEntity {
  id: string
  code: string
  name: string
  isRequired: boolean
  requirement: DocumentRequirement
  lateDueMonths: number | null
  isActive: boolean
  sortOrder: number
  documentCount: number
}
