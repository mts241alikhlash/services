export { DocumentModule } from './document.module.js'
export {
  UploadAdmissionDocumentUseCase,
  ADMISSION_ALLOWED_MIME_TYPES,
  ADMISSION_MAX_FILE_SIZE,
  assertValidAdmissionFile,
} from './application/use-cases/upload-admission-document/upload-admission-document.use-case.js'
export { VerifyDocumentUseCase } from './application/use-cases/verify-document/verify-document.use-case.js'
export { IAdmissionDocumentRepository } from './domain/repositories/admission-document-repository.js'
export type {
  AdmissionDocumentApplicationRef,
  CreateDocumentFileInput,
} from './domain/repositories/admission-document-repository.js'
export { IAdmissionFileStorage } from './domain/repositories/admission-file-storage.js'
export type {
  AdmissionDocumentRow,
  AdmissionDocumentTypeRow,
  AdmissionDocumentTypeRef,
  AdmissionDocumentWithType,
  AdmissionDocumentWithTypeAndFile,
} from './domain/entities/admission-document.entity.js'
export type {
  AdmissionFileRef,
  AdmissionUploadFile,
} from './domain/entities/admission-file.entity.js'
export type { UploadAdmissionDocumentInput } from './application/use-cases/upload-admission-document/upload-admission-document.input.js'
export type { VerifyDocumentInput } from './application/use-cases/verify-document/verify-document.input.js'
