import { Injectable } from '@nestjs/common'
import { IReferenceLookupPort } from '../../../../../platform/reference-lookup/reference-lookup.port.js'
import type { EnrolmentTab } from '../../../domain/entities/enrolment.entity.js'
import { IAdmissionEnrolmentRepository } from '../../../domain/repositories/admission-enrolment.repository.js'

interface GetEnrolmentQueueInput {
  tab?: EnrolmentTab
  search?: string
  waveId?: string
  page?: number
  limit?: number
}

@Injectable()
export class GetEnrolmentQueueUseCase {
  constructor(
    private readonly enrolments: IAdmissionEnrolmentRepository,
    private readonly lookup: IReferenceLookupPort,
  ) {}

  async execute(input: GetEnrolmentQueueInput) {
    const page = input.page ?? 1
    const limit = input.limit ?? 20
    const { records, total, counts, years } = await this.enrolments.findQueue({
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
