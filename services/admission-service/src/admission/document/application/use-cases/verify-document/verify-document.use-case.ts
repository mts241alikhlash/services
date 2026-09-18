import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { AdmissionDocumentStatus } from '../../../../../shared/domain/enums/admission-document-status.enum.js'
import { IAdmissionDocumentNotificationPort } from '../../../domain/repositories/admission-document-notification.port.js'
import { IAdmissionDocumentRepository } from '../../../domain/repositories/admission-document-repository.js'
import type { VerifyDocumentInput } from './verify-document.input.js'

@Injectable()
export class VerifyDocumentUseCase {
  constructor(
    private readonly documents: IAdmissionDocumentRepository,
    private readonly notifications: IAdmissionDocumentNotificationPort,
  ) {}

  async execute(input: VerifyDocumentInput) {
    if (
      input.status === AdmissionDocumentStatus.REJECTED &&
      !input.note?.trim()
    ) {
      throw new BadRequestException('A rejection reason is required')
    }

    const document = await this.documents.findDocument(
      input.applicationId,
      input.documentId,
    )
    if (!document) {
      throw new NotFoundException('Document not found')
    }

    const updated = await this.documents.updateDocumentStatus(document.id, {
      status: input.status,
      note: input.note ?? null,
      adminId: input.adminId,
    })

    await this.notifications.notify(
      input.applicationId,
      'DOCUMENT',
      input.status === AdmissionDocumentStatus.APPROVED
        ? `Berkas ${document.documentType.name} disetujui`
        : `Berkas ${document.documentType.name} ditolak`,
      input.status === AdmissionDocumentStatus.APPROVED
        ? `Berkas ${document.documentType.name} Anda telah diverifikasi dan disetujui.`
        : `Berkas ${document.documentType.name} Anda ditolak. Catatan: ${input.note}. Silakan unggah ulang.`,
    )

    return updated
  }
}
