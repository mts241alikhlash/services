import type { AdmissionUploadFile } from '../../../domain/entities/admission-file.entity.js'

export interface UploadAdmissionDocumentInput {
  userId: string
  documentTypeCode: string
  file: AdmissionUploadFile
}

export interface UploadAdmissionDocumentForApplicationInput {
  applicationId: string
  documentTypeCode: string
  file: AdmissionUploadFile
  adminId: string
}
