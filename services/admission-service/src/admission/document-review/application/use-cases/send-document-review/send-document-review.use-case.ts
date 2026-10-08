import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { AdmissionNotificationService } from '../../../../notification/index.js'
import { VerifyApplicationWhenReadyUseCase } from '../../../../verification/index.js'
import { planSend } from '../../../domain/policies/send-plan.policy.js'
import { IAdmissionDocumentReviewRepository } from '../../../domain/repositories/admission-document-review.repository.js'

interface SendDocumentReviewInput {
  applicationId: string
  dataNote?: string
  adminId: string
}

@Injectable()
export class SendDocumentReviewUseCase {
  constructor(
    private readonly reviews: IAdmissionDocumentReviewRepository,
    private readonly notifications: AdmissionNotificationService,
    private readonly verifyWhenReady: VerifyApplicationWhenReadyUseCase,
  ) {}

  async execute(input: SendDocumentReviewInput) {
    const context = await this.reviews.findContext(input.applicationId)
    if (!context || context.status === 'DRAFT') {
      throw new NotFoundException('Pendaftar tidak ditemukan')
    }
    if (context.status !== 'SUBMITTED') {
      throw new ConflictException(
        'Hasil pemeriksaan hanya bisa dikirim selama pendaftaran menunggu pemeriksaan',
      )
    }

    const plan = planSend(
      context.slots.map((slot) => ({
        id: slot.documentTypeId,
        name: slot.name,
        isRequired: slot.isRequired,
      })),
      context.slots.flatMap((slot) =>
        slot.document
          ? [
              {
                documentTypeId: slot.documentTypeId,
                status: slot.document.status,
                note: slot.document.note,
              },
            ]
          : [],
      ),
      input.dataNote,
    )

    if (plan.kind === 'BLOCKED') {
      throw new ConflictException(
        'Masih ada berkas wajib yang belum diputuskan atau belum diunggah',
      )
    }

    if (plan.kind === 'REVISION') {
      const returned = await this.reviews.markRevisionNeeded(
        input.applicationId,
        plan.revisionNote,
      )
      if (!returned) {
        throw new ConflictException(
          'Pendaftaran berubah saat Anda bekerja, muat ulang dan coba lagi',
        )
      }
      await this.notifications.notify(
        input.applicationId,
        'STATUS_CHANGE',
        'Formulir perlu diperbaiki',
        `Panitia mengembalikan formulir Anda untuk diperbaiki.\n${plan.revisionNote}\nSetelah diperbaiki, kirim kembali formulir Anda.`,
      )
      return {
        status: 'REVISION_NEEDED' as const,
        outcome: 'REVISION_REQUESTED' as const,
        verified: false,
      }
    }

    const recorded = await this.reviews.recordApproval(input.applicationId)
    if (!recorded) {
      throw new ConflictException(
        'Hasil pemeriksaan sudah dikirim atau berkas berubah, muat ulang dan coba lagi',
      )
    }
    const verified = await this.verifyWhenReady.execute(
      input.applicationId,
      input.adminId,
    )
    return {
      status: verified ? ('VERIFIED' as const) : ('SUBMITTED' as const),
      outcome: 'APPROVED' as const,
      verified,
    }
  }
}
