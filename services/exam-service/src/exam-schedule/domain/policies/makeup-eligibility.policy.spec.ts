import type { ExamSession } from '../../../exam-session/domain/entities/exam-session.entity.js'
import {
  assessMakeupEligibility,
  type Sitting,
} from './makeup-eligibility.policy.js'

const sitting = (
  status: ExamSession['status'],
  options: { submitted?: boolean; answers?: number } = {},
): Sitting => ({
  session: {
    status,
    submittedAt: options.submitted ? new Date() : null,
  } as ExamSession,
  answerCount: options.answers ?? 0,
})

const assess = (sittings: Sitting[], onLiveMakeup = false) =>
  assessMakeupEligibility({ sittings, onLiveMakeup })

describe('assessMakeupEligibility', () => {
  it('lets a student with no session sit a makeup', () => {
    expect(assess([])).toEqual({ eligible: true })
  })

  it('lets a student whose session was closed by the clock with no answers sit a makeup, whatever its status', () => {
    for (const status of ['EXPIRED', 'GRADED', 'SUBMITTED'] as const) {
      expect(assess([sitting(status)])).toEqual({ eligible: true })
    }
  })

  it('counts a session with answers as having sat the exam', () => {
    expect(assess([sitting('GRADED', { answers: 3 })])).toEqual({
      eligible: false,
      reason: 'ALREADY_SAT',
    })
  })

  it('counts a session the student handed in as having sat the exam, even with no answers', () => {
    expect(assess([sitting('SUBMITTED', { submitted: true })])).toEqual({
      eligible: false,
      reason: 'ALREADY_SAT',
    })
  })

  it('refuses a student who is working on an exam right now', () => {
    expect(assess([sitting('IN_PROGRESS')])).toEqual({
      eligible: false,
      reason: 'IN_PROGRESS',
    })
  })

  it('looks at every sitting, so one on an earlier makeup counts too', () => {
    expect(
      assess([sitting('GRADED'), sitting('GRADED', { answers: 2 })]),
    ).toEqual({ eligible: false, reason: 'ALREADY_SAT' })
  })

  it('refuses a student on a live makeup, but a sitting is the more telling reason', () => {
    expect(assess([], true)).toEqual({
      eligible: false,
      reason: 'ON_LIVE_MAKEUP',
    })
    expect(assess([sitting('SUBMITTED', { submitted: true })], true)).toEqual({
      eligible: false,
      reason: 'ALREADY_SAT',
    })
  })
})
