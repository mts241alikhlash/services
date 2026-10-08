import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { AcceptApplicationUseCase } from '../../../../application/index.js'

const MAX_APPLICANTS = 50

interface AcceptManyInput {
  applicationIds: string[]
  note?: string
  adminId: string
}

interface AcceptManyResult {
  applicationId: string
  outcome: 'ACCEPTED' | 'SKIPPED'
  reason?: string
}

@Injectable()
export class AcceptManyUseCase {
  private readonly logger = new Logger(AcceptManyUseCase.name)

  constructor(private readonly accept: AcceptApplicationUseCase) {}

  async execute(
    input: AcceptManyInput,
  ): Promise<{ results: AcceptManyResult[] }> {
    const ids = [...new Set(input.applicationIds)]
    if (ids.length === 0 || ids.length > MAX_APPLICANTS) {
      throw new BadRequestException(
        `Pilih 1 sampai ${MAX_APPLICANTS} pendaftar`,
      )
    }

    const results: AcceptManyResult[] = []
    for (const applicationId of ids) {
      try {
        await this.accept.execute(
          applicationId,
          { note: input.note },
          input.adminId,
        )
        results.push({ applicationId, outcome: 'ACCEPTED' })
      } catch (error) {
        results.push({
          applicationId,
          outcome: 'SKIPPED',
          reason: this.reasonOf(error, applicationId),
        })
      }
    }
    return { results }
  }

  private reasonOf(error: unknown, applicationId: string): string {
    if (error instanceof NotFoundException) return 'Pendaftar tidak ditemukan'
    if (error instanceof ConflictException) {
      return 'Status pendaftar sudah berubah'
    }
    this.logger.error(
      `Accepting ${applicationId} failed`,
      error instanceof Error ? error.stack : undefined,
    )
    return 'Gagal memproses, coba lagi'
  }
}
