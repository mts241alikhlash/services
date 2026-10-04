import {
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
import { assertValidAdmissionFile } from '../upload-admission-document/upload-admission-document.use-case.js'

@Injectable()
export class UploadAttachmentUseCase {
  constructor(
    private readonly documents: IAdmissionDocumentRepository,
    private readonly storage: IAdmissionFileStorage,
  ) {}

  async execute(userId: string, file: AdmissionUploadFile) {
    assertValidAdmissionFile(file)
    const application = await this.documents.findApplicationForUpload(userId)
    return this.save(application, file, userId)
  }

  async executeForApplication(
    applicationId: string,
    file: AdmissionUploadFile,
    adminId: string,
  ) {
    assertValidAdmissionFile(file)
    const application = await this.documents.findByApplicationId(applicationId)
    return this.save(application, file, adminId)
  }

  private async save(
    application: AdmissionDocumentApplicationRef | null,
    file: AdmissionUploadFile,
    uploadedBy: string,
  ): Promise<{ id: string }> {
    if (!application) {
      throw new NotFoundException('Formulir pendaftaran tidak ditemukan')
    }
    if (!isEditable(application.status as Parameters<typeof isEditable>[0])) {
      throw new ConflictException(
        'Lampiran hanya bisa diunggah saat formulir masih draf atau diminta revisi',
      )
    }

    const { filename, storageKey } = await this.storage.save(file, [
      'attachments',
    ])

    return this.documents.saveAttachment({
      applicationId: application.id,
      file: {
        filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        storageKey,
        uploadedBy,
      },
    })
  }
}
