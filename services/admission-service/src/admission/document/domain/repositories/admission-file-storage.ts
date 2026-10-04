import type {
  AdmissionStoredFile,
  AdmissionUploadFile,
} from '../entities/admission-file.entity.js'

export abstract class IAdmissionFileStorage {
  abstract save(
    file: AdmissionUploadFile,
    segments: string[],
  ): Promise<AdmissionStoredFile>
}
