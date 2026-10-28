import { Injectable } from '@nestjs/common'
import { withClassroomNames } from '../../../../exam-schedule/application/with-classroom-names.js'
import type { ExamScheduleView } from '../../../../exam-schedule/domain/entities/exam-schedule.entity.js'
import { IExamScheduleRepository } from '../../../../exam-schedule/domain/repositories/exam-schedule.repository.js'
import type { ScheduleSessionCounts } from '../../../../exam-session/domain/repositories/exam-session.repository.js'
import { IExamSessionRepository } from '../../../../exam-session/domain/repositories/exam-session.repository.js'
import { IAcademicLookupPort } from '../../../../platform/academic-lookup/academic-lookup.port.js'
import type { PaginatedResult } from '../../../../shared/domain/interfaces/repository.interface.js'
import {
  GradingScopeService,
  type GradingUser,
} from '../../grading-scope.service.js'

export interface GradingSchedule
  extends ExamScheduleView, ScheduleSessionCounts {}

@Injectable()
export class ListGradingSchedulesUseCase {
  constructor(
    private readonly scope: GradingScopeService,
    private readonly schedules: IExamScheduleRepository,
    private readonly sessions: IExamSessionRepository,
    private readonly academic: IAcademicLookupPort,
  ) {}

  async execute(
    user: GradingUser,
    query: { page: number; limit: number; semesterId?: string },
  ): Promise<PaginatedResult<GradingSchedule>> {
    const semesterId =
      query.semesterId ?? (await this.academic.activeSemester())?.id
    if (semesterId === undefined) {
      return { data: [], total: 0, page: query.page, limit: query.limit }
    }

    const scope = await this.scope.forUser(user)
    const pairs = scope.all ? null : await scope.pairsFor(semesterId)
    const page = await this.schedules.findForGrading({
      semesterId,
      pairs,
      page: query.page,
      limit: query.limit,
    })

    const [named, counts] = await Promise.all([
      withClassroomNames(this.academic, page.data),
      this.sessions.countsBySchedule(page.data.map((row) => row.id)),
    ])
    return {
      ...page,
      data: named.map((row) => ({
        ...row,
        sessions: counts.get(row.id)?.sessions ?? 0,
        awaitingGrading: counts.get(row.id)?.awaitingGrading ?? 0,
        graded: counts.get(row.id)?.graded ?? 0,
      })),
    }
  }
}
