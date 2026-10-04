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
import { MAX_UPLOAD_BYTES } from '../../../../../core/upload/upload-limits.js'

export const ADMISSION_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'application/pdf',
]
export const ADMISSION_MAX_FILE_SIZE = MAX_UPLOAD_BYTES

const SIGNATURES: Record<string, number[]> = {
  'application/pdf': [0x25, 0x50, 0x44, 0x46, 0x2d],
  'image/png': [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  'image/jpeg': [0xff, 0xd8, 0xff],
}

function contentMatches(file: AdmissionUploadFile): boolean {
  const signature = SIGNATURES[file.mimetype]
  return (
    signature !== undefined &&
    file.buffer?.length >= signature.length &&
    signature.every((byte, index) => file.buffer[index] === byte)
  )
}

export function assertValidAdmissionFile(file: AdmissionUploadFile): void {
  if (!ADMISSION_ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new BadRequestException('Berkas harus JPG, PNG, atau PDF')
  }
  if (file.size > ADMISSION_MAX_FILE_SIZE) {
    throw new BadRequestException('Ukuran berkas maksimal 5 MB')
  }
  if (!contentMatches(file)) {
    throw new BadRequestException('Isi berkas tidak sesuai dengan jenisnya')
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
      throw new NotFoundException('Formulir pendaftaran tidak ditemukan')
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
      throw new NotFoundException('Formulir pendaftaran tidak ditemukan')
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
        'Berkas hanya bisa diunggah saat formulir masih draf atau diminta revisi',
      )
    }

    const documentType = await this.documents.findDocumentTypeByCode(
      input.documentTypeCode,
    )
    if (!documentType) {
      throw new NotFoundException(
        `Jenis berkas tidak dikenal: ${input.documentTypeCode}`,
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
