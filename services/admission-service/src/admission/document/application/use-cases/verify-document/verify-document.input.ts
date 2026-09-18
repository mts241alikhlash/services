import type { AdmissionDocumentStatus } from '../../../../../shared/domain/enums/admission-document-status.enum.js'

export interface VerifyDocumentInput {
  applicationId: string
  documentId: string
  status: AdmissionDocumentStatus
  note?: string
  adminId: string
}
