import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { AdmissionNotificationService } from '../../../../notification/index.js'
import { VerifyApplicationWhenReadyUseCase } from '../../../../verification/index.js'
import { IAdmissionDecisionRepository } from '../../../domain/repositories/admission-decision.repository.js'

interface CancelRejectionInput {
  applicationId: string
  reason: string
  adminId: string
}

@Injectable()
export class CancelRejectionUseCase {
  constructor(
    private readonly decisions: IAdmissionDecisionRepository,
    private readonly notifications: AdmissionNotificationService,
    private readonly verifyWhenReady: VerifyApplicationWhenReadyUseCase,
  ) {}

  async execute(input: CancelRejectionInput) {
    const reason = input.reason.trim()
    if (!reason) {
      throw new BadRequestException('Alasan pembatalan wajib diisi')
    }
    const current = await this.decisions.findStatus(input.applicationId)
    if (!current) throw new NotFoundException('Pendaftar tidak ditemukan')
    if (current.status !== 'REJECTED') {
      throw new ConflictException('Pendaftar tidak sedang berstatus ditolak')
    }

    const cancelled = await this.decisions.cancelRejection(input.applicationId)
    if (!cancelled) {
      throw new ConflictException(
        'Pendaftaran berubah saat Anda bekerja, muat ulang dan coba lagi',
      )
    }
    await this.notifications.notify(
      input.applicationId,
      'STATUS_CHANGE',
      'Keputusan penolakan ditinjau ulang',
      `Panitia meninjau ulang keputusan penolakan pendaftaran Anda dan akan menyampaikan keputusan berikutnya melalui akun ini. Catatan panitia: ${reason}.`,
    )
    const verified = await this.verifyWhenReady.execute(
      input.applicationId,
      input.adminId,
    )
    return {
      applicationId: input.applicationId,
      status: verified ? ('VERIFIED' as const) : ('SUBMITTED' as const),
      verified,
    }
  }
}
