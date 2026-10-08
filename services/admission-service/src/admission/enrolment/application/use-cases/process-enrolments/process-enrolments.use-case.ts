import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
} from '@nestjs/common'
import { EnrollApplicantUseCase } from '../../../../application/index.js'
import { IAdmissionEnrolmentRepository } from '../../../domain/repositories/admission-enrolment.repository.js'

const MAX_APPLICANTS = 50

interface ProcessEnrolmentsInput {
  applicationIds: string[]
  nisn?: { applicationId: string; nisn: string }[]
  bearerToken: string
}

interface ProcessResult {
  applicationId: string
  outcome: 'ENROLLED' | 'SKIPPED' | 'FAILED'
  reason?: string
}

@Injectable()
export class ProcessEnrolmentsUseCase {
  private readonly logger = new Logger(ProcessEnrolmentsUseCase.name)

  constructor(
    private readonly enrolments: IAdmissionEnrolmentRepository,
    private readonly enroll: EnrollApplicantUseCase,
  ) {}

  async execute(
    input: ProcessEnrolmentsInput,
  ): Promise<{ results: ProcessResult[] }> {
    const ids = [...new Set(input.applicationIds)]
    if (ids.length === 0 || ids.length > MAX_APPLICANTS) {
      throw new BadRequestException(
        `Pilih 1 sampai ${MAX_APPLICANTS} pendaftar`,
      )
    }
    const typed = new Map(
      (input.nisn ?? []).map((entry) => [
        entry.applicationId,
        entry.nisn.trim(),
      ]),
    )

    const results: ProcessResult[] = []
    for (const applicationId of ids) {
      const state = await this.enrolments.findProcessState(applicationId)
      const skip = (reason: string) =>
        results.push({ applicationId, outcome: 'SKIPPED', reason })
      if (!state) {
        skip('Pendaftar tidak ditemukan')
        continue
      }
      if (state.status !== 'ACCEPTED' && state.status !== 'ENROLLING') {
        skip('Pendaftar belum berstatus diterima')
        continue
      }
      const nisn = typed.get(applicationId) || state.nisn
      if (!state.nis) {
        skip('NIS belum disusun')
        continue
      }
      if (!state.targetGradeId) {
        skip('Tingkat kelas tujuan belum diisi')
        continue
      }
      if (!nisn) {
        skip('NISN belum diisi')
        continue
      }

      try {
        await this.enroll.execute(
          applicationId,
          { nis: state.nis, nisn, gradeId: state.targetGradeId },
          input.bearerToken,
        )
        results.push({ applicationId, outcome: 'ENROLLED' })
      } catch (error) {
        this.logger.error(`Enrolling ${applicationId} failed: ${String(error)}`)
        results.push({
          applicationId,
          outcome: 'FAILED',
          reason:
            error instanceof HttpException
              ? error.message
              : 'Gagal memproses, coba lagi',
        })
      }
    }
    return { results }
  }
}
