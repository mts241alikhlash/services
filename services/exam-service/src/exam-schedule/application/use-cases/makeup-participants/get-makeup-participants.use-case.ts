import { Injectable, NotFoundException } from '@nestjs/common'
import { IExamSessionRepository } from '../../../../exam-session/domain/repositories/exam-session.repository.js'
import { IStudentDirectoryPort } from '../../../../platform/student-directory/student-directory.port.js'
import type { MakeupReason } from '../../../domain/entities/exam-schedule.entity.js'
import { sittingOutcome } from '../../../domain/policies/makeup-eligibility.policy.js'
import { loadSittings } from '../../student-sittings.js'
import type { GradingUser } from '../../../../exam-grading/application/grading-scope.service.js'
import { MakeupScopeService } from '../../makeup-scope.service.js'
import { IExamScheduleRepository } from '../../../domain/repositories/exam-schedule.repository.js'

export type ParticipantStatus =
  'WAITING' | 'SAT_REGULAR' | 'IN_PROGRESS' | 'DONE'

export interface ParticipantRow {
  studentId: string
  name: string | null
  nis: string | null
  reason: MakeupReason
  note: string | null
  status: ParticipantStatus
}

@Injectable()
export class GetMakeupParticipantsUseCase {
  constructor(
    private readonly schedules: IExamScheduleRepository,
    private readonly sessions: IExamSessionRepository,
    private readonly students: IStudentDirectoryPort,
    private readonly scope: MakeupScopeService,
  ) {}

  async execute(
    user: GradingUser,
    scheduleId: string,
  ): Promise<ParticipantRow[]> {
    const makeup = await this.schedules.findById(scheduleId)
    if (makeup?.kind !== 'MAKEUP' || makeup.makeupOfId === null) {
      throw new NotFoundException('Jadwal susulan tidak ditemukan')
    }
    await this.scope.assertAllowed(user, makeup)
    const participants = await this.schedules.listParticipants(scheduleId)
    const refs = new Map(
      (
        await this.students.refsByIds(participants.map((row) => row.studentId))
      ).map((ref) => [ref.id, ref]),
    )

    const rows: ParticipantRow[] = []
    for (const participant of participants) {
      const ref = refs.get(participant.studentId)
      rows.push({
        studentId: participant.studentId,
        name: ref?.name ?? null,
        nis: ref?.nis ?? null,
        reason: participant.reason,
        note: participant.note,
        status: await this.statusOf(
          participant.studentId,
          scheduleId,
          makeup.makeupOfId,
        ),
      })
    }
    return rows.sort((a, b) =>
      (a.name ?? a.nis ?? '').localeCompare(b.name ?? b.nis ?? '', 'id'),
    )
  }

  private async statusOf(
    studentId: string,
    makeupId: string,
    originalId: string,
  ): Promise<ParticipantStatus> {
    const [own] = await this.sessions.listByStudentAndSchedules(studentId, [
      makeupId,
    ])
    if (own !== undefined) {
      return own.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'DONE'
    }
    const sittings = await loadSittings(
      this.schedules,
      this.sessions,
      originalId,
      studentId,
      makeupId,
    )
    return sittings.some((sitting) => sittingOutcome(sitting) !== 'NONE')
      ? 'SAT_REGULAR'
      : 'WAITING'
  }
}
