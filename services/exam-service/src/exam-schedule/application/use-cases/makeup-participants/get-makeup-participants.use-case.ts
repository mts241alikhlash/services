import { Injectable, NotFoundException } from '@nestjs/common'
import { IExamSessionRepository } from '../../../../exam-session/domain/repositories/exam-session.repository.js'
import { IStudentDirectoryPort } from '../../../../platform/student-directory/student-directory.port.js'
import type { MakeupReason } from '../../../domain/entities/exam-schedule.entity.js'
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
  ) {}

  async execute(scheduleId: string): Promise<ParticipantRow[]> {
    const makeup = await this.schedules.findById(scheduleId)
    if (makeup?.kind !== 'MAKEUP' || makeup.makeupOfId === null) {
      throw new NotFoundException('Jadwal susulan tidak ditemukan')
    }
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
    const [regular] = await this.sessions.listByStudentAndSchedules(studentId, [
      originalId,
    ])
    if (regular === undefined) return 'WAITING'
    if (regular.status !== 'EXPIRED') return 'SAT_REGULAR'
    const answers = await this.sessions.listAnswers(regular.id)
    return answers.length > 0 ? 'SAT_REGULAR' : 'WAITING'
  }
}
