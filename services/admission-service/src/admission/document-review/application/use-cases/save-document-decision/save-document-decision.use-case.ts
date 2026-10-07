import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { IAdmissionDocumentReviewRepository } from '../../../domain/repositories/admission-document-review.repository.js'

interface SaveDocumentDecisionInput {
  applicationId: string
  documentId: string
  status: 'APPROVED' | 'REJECTED'
  note?: string
  adminId: string
}

@Injectable()
export class SaveDocumentDecisionUseCase {
  constructor(private readonly reviews: IAdmissionDocumentReviewRepository) {}

  async execute(input: SaveDocumentDecisionInput) {
    const note = input.status === 'REJECTED' ? input.note?.trim() : undefined
    if (input.status === 'REJECTED' && !note) {
      throw new BadRequestException('Alasan penolakan berkas wajib diisi')
    }

    const result = await this.reviews.saveDecision({
      applicationId: input.applicationId,
      documentId: input.documentId,
      status: input.status,
      note: note ?? null,
      adminId: input.adminId,
    })
    if (result.outcome === 'NOT_FOUND') {
      throw new NotFoundException('Berkas tidak ditemukan')
    }
    if (result.outcome === 'NOT_SUBMITTED') {
      throw new ConflictException(
        'Keputusan berkas hanya bisa diubah selama pendaftaran menunggu pemeriksaan',
      )
    }
    return result.document
  }
}
