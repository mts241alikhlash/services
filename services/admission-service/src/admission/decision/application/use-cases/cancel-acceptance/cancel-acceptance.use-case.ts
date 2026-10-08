import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { AdmissionNotificationService } from '../../../../notification/index.js'
import { IAdmissionDecisionRepository } from '../../../domain/repositories/admission-decision.repository.js'

interface CancelAcceptanceInput {
  applicationId: string
  reason: string
  adminId: string
}

@Injectable()
export class CancelAcceptanceUseCase {
  constructor(
    private readonly decisions: IAdmissionDecisionRepository,
    private readonly notifications: AdmissionNotificationService,
  ) {}

  async execute(input: CancelAcceptanceInput) {
    const reason = input.reason.trim()
    if (!reason) {
      throw new BadRequestException('Alasan pembatalan wajib diisi')
    }
    const current = await this.decisions.findStatus(input.applicationId)
    if (!current) throw new NotFoundException('Pendaftar tidak ditemukan')
    if (current.status === 'ENROLLING' || current.status === 'ENROLLED') {
      throw new ConflictException(
        'Penerimaan tidak bisa dibatalkan setelah proses daftar ulang dimulai',
      )
    }
    if (current.status !== 'ACCEPTED') {
      throw new ConflictException('Pendaftar tidak sedang berstatus diterima')
    }

    const cancelled = await this.decisions.cancelAcceptance(input.applicationId)
    if (!cancelled) {
      throw new ConflictException(
        'Pendaftaran berubah saat Anda bekerja, muat ulang dan coba lagi',
      )
    }
    await this.notifications.notify(
      input.applicationId,
      'STATUS_CHANGE',
      'Keputusan penerimaan ditinjau ulang',
      `Panitia meninjau ulang keputusan penerimaan Anda dan akan menyampaikan keputusan berikutnya melalui akun ini. Catatan panitia: ${reason}.`,
    )
    return { applicationId: input.applicationId, status: 'VERIFIED' as const }
  }
}
