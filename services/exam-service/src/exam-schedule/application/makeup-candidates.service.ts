import { Injectable } from '@nestjs/common'
import { IExamSessionRepository } from '../../exam-session/domain/repositories/exam-session.repository.js'
import { IEnrollmentLookupPort } from '../../platform/enrollment-lookup/enrollment-lookup.port.js'
import type { ExamSchedule } from '../domain/entities/exam-schedule.entity.js'
import {
  assessMakeupEligibility,
  type Eligibility,
} from '../domain/policies/makeup-eligibility.policy.js'
import { IExamScheduleRepository } from '../domain/repositories/exam-schedule.repository.js'
import { loadSittings } from './student-sittings.js'

export interface MakeupCandidate {
  studentId: string
  eligibility: Eligibility
}

@Injectable()
export class MakeupCandidatesService {
  constructor(
    private readonly enrollments: IEnrollmentLookupPort,
    private readonly sessions: IExamSessionRepository,
    private readonly schedules: IExamScheduleRepository,
  ) {}

  async evaluate(
    original: ExamSchedule,
    now: Date,
  ): Promise<MakeupCandidate[]> {
    const roster = await this.enrollments.listActiveByClassroom(
      original.classroomId,
      original.semesterId,
    )
    const live = (await this.schedules.findMakeupsOf(original.id)).filter(
      (makeup) => makeup.status === 'SCHEDULED' && makeup.endsAt > now,
    )
    const onLive = new Set<string>()
    for (const makeup of live) {
      for (const row of await this.schedules.listParticipants(makeup.id)) {
        onLive.add(row.studentId)
      }
    }

    const candidates: MakeupCandidate[] = []
    for (const enrollment of roster) {
      candidates.push({
        studentId: enrollment.studentId,
        eligibility: assessMakeupEligibility({
          sittings: await loadSittings(
            this.schedules,
            this.sessions,
            original.id,
            enrollment.studentId,
          ),
          onLiveMakeup: onLive.has(enrollment.studentId),
        }),
      })
    }
    return candidates
  }
}
