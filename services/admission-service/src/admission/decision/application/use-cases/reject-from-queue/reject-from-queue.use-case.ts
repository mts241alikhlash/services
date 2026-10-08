import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { RejectApplicationUseCase } from '../../../../application/index.js'
import { IAdmissionDecisionRepository } from '../../../domain/repositories/admission-decision.repository.js'

interface RejectFromQueueInput {
  applicationId: string
  reason: string
  adminId: string
}

@Injectable()
export class RejectFromQueueUseCase {
  constructor(
    private readonly decisions: IAdmissionDecisionRepository,
    private readonly reject: RejectApplicationUseCase,
  ) {}

  async execute(input: RejectFromQueueInput) {
    const reason = input.reason.trim()
    if (!reason) {
      throw new BadRequestException('Alasan penolakan wajib diisi')
    }
    const current = await this.decisions.findStatus(input.applicationId)
    if (!current) throw new NotFoundException('Pendaftar tidak ditemukan')
    if (current.status !== 'VERIFIED') {
      throw new ConflictException(
        'Hanya pendaftar terverifikasi yang bisa diputuskan di sini',
      )
    }
    return this.reject.execute(input.applicationId, { reason }, input.adminId)
  }
}
