import { AdmissionDocumentStatus } from '../../../../shared/domain/enums/admission-document-status.enum.js'
import type { AdmissionFileRef } from './admission-file.entity.js'

export interface AdmissionDocumentTypeRef {
  id: string
  code: string
  name: string
  isRequired: boolean
  sortOrder: number
  isActive: boolean
}

export type AdmissionDocumentTypeRow = AdmissionDocumentTypeRef

export interface AdmissionDocumentRow {
  id: string
  applicationId: string
  documentTypeId: string
  fileId?: string | null
  status: `${AdmissionDocumentStatus}`
  note?: string | null
  verifiedById?: string | null
  verifiedAt?: Date | null
}

export interface AdmissionDocumentWithType extends AdmissionDocumentRow {
  documentType: AdmissionDocumentTypeRef
}

export interface AdmissionDocumentWithTypeAndFile extends AdmissionDocumentWithType {
  file?: AdmissionFileRef | null
}
