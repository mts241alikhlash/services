import type { ExamSession } from '../../../exam-session/domain/entities/exam-session.entity.js'

export type MakeupRefusal = 'ALREADY_SAT' | 'IN_PROGRESS' | 'ON_LIVE_MAKEUP'

export type Eligibility =
  { eligible: true } | { eligible: false; reason: MakeupRefusal }

export interface Sitting {
  session: ExamSession
  answerCount: number
}

export function sittingOutcome(
  sitting: Sitting,
): 'SAT' | 'IN_PROGRESS' | 'NONE' {
  if (sitting.session.status === 'IN_PROGRESS') return 'IN_PROGRESS'
  if (sitting.session.submittedAt !== null || sitting.answerCount > 0) {
    return 'SAT'
  }
  return 'NONE'
}

export function assessMakeupEligibility(input: {
  sittings: Sitting[]
  onLiveMakeup: boolean
}): Eligibility {
  const outcomes = input.sittings.map(sittingOutcome)
  if (outcomes.includes('SAT')) {
    return { eligible: false, reason: 'ALREADY_SAT' }
  }
  if (outcomes.includes('IN_PROGRESS')) {
    return { eligible: false, reason: 'IN_PROGRESS' }
  }
  if (input.onLiveMakeup) return { eligible: false, reason: 'ON_LIVE_MAKEUP' }
  return { eligible: true }
}
