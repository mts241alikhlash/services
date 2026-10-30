import { IExamSessionRepository } from '../../exam-session/domain/repositories/exam-session.repository.js'
import type { Sitting } from '../domain/policies/makeup-eligibility.policy.js'
import { IExamScheduleRepository } from '../domain/repositories/exam-schedule.repository.js'

export async function loadSittings(
  schedules: IExamScheduleRepository,
  sessions: IExamSessionRepository,
  originalId: string,
  studentId: string,
  excludeScheduleId?: string,
): Promise<Sitting[]> {
  const makeups = (await schedules.findMakeupsOf(originalId)).filter(
    (makeup) => makeup.status === 'SCHEDULED',
  )
  const ids = [originalId, ...makeups.map((makeup) => makeup.id)].filter(
    (id) => id !== excludeScheduleId,
  )
  const found = await sessions.listByStudentAndSchedules(studentId, ids)
  const sittings: Sitting[] = []
  for (const session of found) {
    const answers = await sessions.listAnswers(session.id)
    sittings.push({ session, answerCount: answers.length })
  }
  return sittings
}
