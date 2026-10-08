import { ConflictException, Injectable } from '@nestjs/common'
import { IAdmissionEnrolmentRepository } from '../../../domain/repositories/admission-enrolment.repository.js'

interface LockNisInput {
  academicYearId: string
  lockedById: string
}

@Injectable()
export class LockNisUseCase {
  constructor(private readonly enrolments: IAdmissionEnrolmentRepository) {}

  async execute(input: LockNisInput) {
    const lock = await this.enrolments.lockNis(
      input.academicYearId,
      input.lockedById,
    )
    if (!lock) {
      throw new ConflictException('NIS tahun ajaran ini sudah dikunci')
    }
    return {
      academicYearId: input.academicYearId,
      lockedAt: lock.lockedAt,
      lockedById: input.lockedById,
    }
  }
}
