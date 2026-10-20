import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  IAdmissionDocumentRepository,
  IAdmissionFileStorage,
  assertValidAdmissionFile,
  type AdmissionUploadFile,
} from '../../../../document/index.js'
import { TRACKED_STATUSES } from '../../../domain/late-document.entity.js'
import { ILateDocumentRepository } from '../../../domain/repositories/late-document.repository.js'

interface UploadLateDocumentInput {
  applicationId: string
  documentTypeId: string
  file: AdmissionUploadFile
  adminId: string
}

@Injectable()
export class UploadLateDocumentUseCase {
  constructor(
    private readonly repository: ILateDocumentRepository,
    private readonly documents: IAdmissionDocumentRepository,
    private readonly storage: IAdmissionFileStorage,
  ) {}

  async execute(input: UploadLateDocumentInput) {
    assertValidAdmissionFile(input.file)

    const pair = await this.repository.findPair(
      input.applicationId,
      input.documentTypeId,
    )
    if (!pair) throw new NotFoundException('Berkas susulan tidak ditemukan')
    if (
      !(TRACKED_STATUSES as readonly string[]).includes(pair.applicationStatus)
    ) {
      throw new ConflictException(
        'Pendaftaran ini belum bisa menerima berkas susulan',
      )
    }
    if (pair.document?.status === 'APPROVED') {
      throw new ConflictException(
        'Berkas sudah disetujui, tolak dulu bila perlu diganti',
      )
    }

    const { filename, storageKey } = await this.storage.save(input.file, [
      'documents',
      pair.documentType.code,
    ])
    return this.documents.saveDocument({
      applicationId: input.applicationId,
      documentTypeId: input.documentTypeId,
      file: {
        filename,
        originalName: input.file.originalname,
        mimeType: input.file.mimetype,
        sizeBytes: input.file.size,
        storageKey,
        uploadedBy: input.adminId,
      },
    })
  }
}
