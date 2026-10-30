import type { ExamSession } from '../../../exam-session/domain/entities/exam-session.entity.js'

export type MakeupRefusal = 'ALREADY_SAT' | 'IN_PROGRESS' | 'ON_LIVE_MAKEUP'

export type Eligibility =
  { eligible: true } | { eligible: false; reason: MakeupRefusal }

export function assessMakeupEligibility(input: {
  session: ExamSession | null
  answerCount: number
  onLiveMakeup: boolean
}): Eligibility {
  if (input.onLiveMakeup) return { eligible: false, reason: 'ON_LIVE_MAKEUP' }
  const { session } = input
  if (session === null) return { eligible: true }
  if (session.status === 'IN_PROGRESS') {
    return { eligible: false, reason: 'IN_PROGRESS' }
  }
  if (session.status === 'EXPIRED' && input.answerCount === 0) {
    return { eligible: true }
  }
  return { eligible: false, reason: 'ALREADY_SAT' }
}
