import type { ExamSession } from '../../../exam-session/domain/entities/exam-session.entity.js'
import { assessMakeupEligibility } from './makeup-eligibility.policy.js'

const session = (status: ExamSession['status']) => ({ status }) as ExamSession

describe('assessMakeupEligibility', () => {
  it('lets a student with no session sit a makeup', () => {
    expect(
      assessMakeupEligibility({
        session: null,
        answerCount: 0,
        onLiveMakeup: false,
      }),
    ).toEqual({ eligible: true })
  })

  it('lets a student whose session expired with no answers sit a makeup', () => {
    expect(
      assessMakeupEligibility({
        session: session('EXPIRED'),
        answerCount: 0,
        onLiveMakeup: false,
      }),
    ).toEqual({ eligible: true })
  })

  it('counts an expired session with answers as having sat the exam', () => {
    expect(
      assessMakeupEligibility({
        session: session('EXPIRED'),
        answerCount: 3,
        onLiveMakeup: false,
      }),
    ).toEqual({ eligible: false, reason: 'ALREADY_SAT' })
  })

  it('counts submitted and graded sessions as having sat the exam', () => {
    for (const status of ['SUBMITTED', 'GRADED'] as const) {
      expect(
        assessMakeupEligibility({
          session: session(status),
          answerCount: 0,
          onLiveMakeup: false,
        }),
      ).toEqual({ eligible: false, reason: 'ALREADY_SAT' })
    }
  })

  it('refuses a student who is working on the regular exam right now', () => {
    expect(
      assessMakeupEligibility({
        session: session('IN_PROGRESS'),
        answerCount: 0,
        onLiveMakeup: false,
      }),
    ).toEqual({ eligible: false, reason: 'IN_PROGRESS' })
  })

  it('refuses a student already on a live makeup of the same exam, before anything else', () => {
    expect(
      assessMakeupEligibility({
        session: null,
        answerCount: 0,
        onLiveMakeup: true,
      }),
    ).toEqual({ eligible: false, reason: 'ON_LIVE_MAKEUP' })
    expect(
      assessMakeupEligibility({
        session: session('SUBMITTED'),
        answerCount: 5,
        onLiveMakeup: true,
      }),
    ).toEqual({ eligible: false, reason: 'ON_LIVE_MAKEUP' })
  })
})
