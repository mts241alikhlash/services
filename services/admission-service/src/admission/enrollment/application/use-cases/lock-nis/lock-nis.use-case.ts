import { ConflictException, Injectable } from '@nestjs/common'
import { IAdmissionEnrollmentRepository } from '../../../domain/repositories/admission-enrollment.repository.js'

interface LockNisInput {
  academicYearId: string
  lockedById: string
}

@Injectable()
export class LockNisUseCase {
  constructor(private readonly enrollments: IAdmissionEnrollmentRepository) {}

  async execute(input: LockNisInput) {
    const lock = await this.enrollments.lockNis(
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
