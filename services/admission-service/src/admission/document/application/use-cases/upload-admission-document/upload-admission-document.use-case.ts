import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { isEditable } from '../../../../application/domain/policies/admission-status.transitions.js'
import type { AdmissionUploadFile } from '../../../domain/entities/admission-file.entity.js'
import {
  IAdmissionDocumentRepository,
  type AdmissionDocumentApplicationRef,
} from '../../../domain/repositories/admission-document-repository.js'
import { IAdmissionFileStorage } from '../../../domain/repositories/admission-file-storage.js'
import type {
  UploadAdmissionDocumentForApplicationInput,
  UploadAdmissionDocumentInput,
} from './upload-admission-document.input.js'

export const ADMISSION_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'application/pdf',
]
export const ADMISSION_MAX_FILE_SIZE = 5 * 1024 * 1024

export function assertValidAdmissionFile(file: AdmissionUploadFile): void {
  if (!ADMISSION_ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new BadRequestException('File must be a JPG, PNG or PDF')
  }
  if (file.size > ADMISSION_MAX_FILE_SIZE) {
    throw new BadRequestException('Ukuran berkas maksimal 5 MB')
  }
}

@Injectable()
export class UploadAdmissionDocumentUseCase {
  constructor(
    private readonly documents: IAdmissionDocumentRepository,
    private readonly storage: IAdmissionFileStorage,
  ) {}

  async execute(input: UploadAdmissionDocumentInput) {
    assertValidAdmissionFile(input.file)

    const application = await this.documents.findApplicationForUpload(
      input.userId,
    )
    if (!application) {
      throw new NotFoundException('Application not found')
    }

    return this.upload(application, {
      documentTypeCode: input.documentTypeCode,
      file: input.file,
      uploadedBy: input.userId,
    })
  }

  async executeForApplication(
    input: UploadAdmissionDocumentForApplicationInput,
  ) {
    assertValidAdmissionFile(input.file)

    const application = await this.documents.findByApplicationId(
      input.applicationId,
    )
    if (!application) {
      throw new NotFoundException('Application not found')
    }

    return this.upload(application, {
      documentTypeCode: input.documentTypeCode,
      file: input.file,
      uploadedBy: input.adminId,
    })
  }

  private async upload(
    application: AdmissionDocumentApplicationRef,
    input: {
      documentTypeCode: string
      file: AdmissionUploadFile
      uploadedBy: string
    },
  ) {
    if (!isEditable(application.status as Parameters<typeof isEditable>[0])) {
      throw new ConflictException(
        'Documents can only be uploaded while the application is DRAFT or NEEDS_REVISION',
      )
    }

    const documentType = await this.documents.findDocumentTypeByCode(
      input.documentTypeCode,
    )
    if (!documentType) {
      throw new NotFoundException(
        `Unknown document type '${input.documentTypeCode}'`,
      )
    }

    const { filename, storageKey } = await this.storage.save(input.file, [
      'documents',
      String(documentType.name ?? ''),
    ])

    return this.documents.saveDocument({
      applicationId: application.id,
      documentTypeId: String(documentType.id ?? ''),
      file: {
        filename,
        originalName: input.file.originalname,
        mimeType: input.file.mimetype,
        sizeBytes: input.file.size,
        storageKey,
        uploadedBy: input.uploadedBy,
      },
    })
  }
}
