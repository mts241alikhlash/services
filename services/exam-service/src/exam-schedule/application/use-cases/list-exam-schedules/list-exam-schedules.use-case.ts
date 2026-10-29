import { Injectable } from '@nestjs/common'
import { IAcademicLookupPort } from '../../../../platform/academic-lookup/academic-lookup.port.js'
import type { PaginatedResult } from '../../../../shared/domain/interfaces/repository.interface.js'
import type { ExamScheduleView } from '../../../domain/entities/exam-schedule.entity.js'
import { IScheduleSessionGuard } from '../../../domain/ports/schedule-session-guard.port.js'
import {
  IExamScheduleRepository,
  type ExamScheduleListQuery,
} from '../../../domain/repositories/exam-schedule.repository.js'
import { withClassroomNames } from '../../with-classroom-names.js'

@Injectable()
export class ListExamSchedulesUseCase {
  constructor(
    private readonly schedules: IExamScheduleRepository,
    private readonly academic: IAcademicLookupPort,
    private readonly guard: IScheduleSessionGuard,
  ) {}

  async execute(
    input: Partial<ExamScheduleListQuery>,
  ): Promise<PaginatedResult<ExamScheduleView>> {
    const page = await this.schedules.findAll({
      ...input,
      page: input.page ?? 1,
      limit: input.limit ?? 10,
    })
    const [named, started] = await Promise.all([
      withClassroomNames(this.academic, page.data),
      this.guard.idsWithSessions(page.data.map((row) => row.id)),
    ])
    return {
      ...page,
      data: named.map((row) => ({ ...row, hasSessions: started.has(row.id) })),
    }
  }
}
