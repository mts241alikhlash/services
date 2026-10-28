import type { MyExamStatus } from '../entities/exam-session.entity.js'

export function myExamStatus(
  window: { startsAt: Date; endsAt: Date },
  session: { status: string } | null,
  now: Date,
): MyExamStatus {
  if (session !== null) {
    return session.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'FINISHED'
  }
  const time = now.getTime()
  if (time < window.startsAt.getTime()) return 'UPCOMING'
  if (time < window.endsAt.getTime()) return 'OPEN'
  return 'FINISHED'
}
