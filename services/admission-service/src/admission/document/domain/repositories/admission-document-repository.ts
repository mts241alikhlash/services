import type {
  AdmissionDocumentTypeRef,
  AdmissionDocumentWithType,
  AdmissionDocumentWithTypeAndFile,
} from '../entities/admission-document.entity.js'
import type { AdmissionDocumentStatus } from '../../../../shared/domain/enums/admission-document-status.enum.js'

export interface AdmissionDocumentApplicationRef {
  id: string
  status: string
}

export interface CreateAdmissionDocumentFileInput {
  filename: string
  originalName: string
  mimeType: string
  sizeBytes: number
  storageKey: string
  uploadedBy?: string | null
}

export type CreateDocumentFileInput = CreateAdmissionDocumentFileInput

export interface SaveAdmissionDocumentInput {
  applicationId: string
  documentTypeId: string
  file: CreateAdmissionDocumentFileInput
}

export interface UpdateAdmissionDocumentStatusInput {
  status: AdmissionDocumentStatus
  note: string | null
  adminId: string
}

export abstract class IAdmissionDocumentRepository {
  abstract findApplicationForUpload(
    userId: string,
  ): Promise<AdmissionDocumentApplicationRef | null>
  abstract findByApplicationId(
    applicationId: string,
  ): Promise<AdmissionDocumentApplicationRef | null>
  abstract findDocumentTypeByCode(
    code: string,
  ): Promise<AdmissionDocumentTypeRef | null>
  abstract findActiveDocumentTypes(): Promise<AdmissionDocumentTypeRef[]>
  abstract findRequiredActiveDocumentTypes(): Promise<
    AdmissionDocumentTypeRef[]
  >
  abstract saveDocument(
    input: SaveAdmissionDocumentInput,
  ): Promise<AdmissionDocumentWithTypeAndFile>
  abstract findDocument(
    applicationId: string,
    documentId: string,
  ): Promise<AdmissionDocumentWithType | null>
  abstract updateDocumentStatus(
    documentId: string,
    input: UpdateAdmissionDocumentStatusInput,
  ): Promise<AdmissionDocumentWithTypeAndFile>
}
