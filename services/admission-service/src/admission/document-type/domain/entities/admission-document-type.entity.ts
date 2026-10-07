export interface AdmissionDocumentTypeEntity {
  id: string
  code: string
  name: string
  isRequired: boolean
  isActive: boolean
  sortOrder: number
  documentCount: number
}
