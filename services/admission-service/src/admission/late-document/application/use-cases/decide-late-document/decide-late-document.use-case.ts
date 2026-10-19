import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { AdmissionDocumentStatus } from '../../../../../shared/domain/enums/admission-document-status.enum.js'
import { IAdmissionDocumentRepository } from '../../../../document/index.js'

interface DecideLateDocumentInput {
  applicationId: string
  documentId: string
  status: 'APPROVED' | 'REJECTED'
  note?: string
  adminId: string
}

@Injectable()
export class DecideLateDocumentUseCase {
  constructor(private readonly documents: IAdmissionDocumentRepository) {}

  async execute(input: DecideLateDocumentInput) {
    const note = input.status === 'REJECTED' ? input.note?.trim() : undefined
    if (input.status === 'REJECTED' && !note) {
      throw new BadRequestException('Alasan penolakan berkas wajib diisi')
    }

    const document = await this.documents.findDocument(
      input.applicationId,
      input.documentId,
    )
    if (!document) throw new NotFoundException('Berkas tidak ditemukan')
    if (document.documentType.requirement !== 'LATER') {
      throw new ConflictException(
        'Berkas ini diperiksa lewat Verifikasi Berkas',
      )
    }

    return this.documents.updateDocumentStatus(document.id, {
      status: AdmissionDocumentStatus[input.status],
      note: note ?? null,
      adminId: input.adminId,
    })
  }
}
