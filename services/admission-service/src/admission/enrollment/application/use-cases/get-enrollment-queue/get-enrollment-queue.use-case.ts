import { Injectable } from '@nestjs/common'
import { IReferenceLookupPort } from '../../../../../platform/reference-lookup/reference-lookup.port.js'
import type { EnrollmentTab } from '../../../domain/entities/enrollment.entity.js'
import { IAdmissionEnrollmentRepository } from '../../../domain/repositories/admission-enrollment.repository.js'

interface GetEnrollmentQueueInput {
  tab?: EnrollmentTab
  search?: string
  waveId?: string
  page?: number
  limit?: number
}

@Injectable()
export class GetEnrollmentQueueUseCase {
  constructor(
    private readonly enrollments: IAdmissionEnrollmentRepository,
    private readonly lookup: IReferenceLookupPort,
  ) {}

  async execute(input: GetEnrollmentQueueInput) {
    const page = input.page ?? 1
    const limit = input.limit ?? 20
    const { records, total, counts, years } = await this.enrollments.findQueue({
      tab: input.tab ?? 'ready',
      search: input.search,
      waveId: input.waveId,
      page,
      limit,
    })
    const names = await this.lookup.listAcademicYears(
      years.map((year) => year.academicYearId),
    )
    return {
      data: records,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        counts,
        years: years.map((year) => ({
          academicYearId: year.academicYearId,
          academicYearName:
            names.find((name) => name.id === year.academicYearId)?.name ?? null,
          locked: year.lockedAt !== null,
          lockedAt: year.lockedAt,
        })),
      },
    }
  }
}
