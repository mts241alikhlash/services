import { nextAttemptState } from '../domain/policies/access-attempt.policy.js'
import type { AttemptState } from '../domain/policies/access-attempt.policy.js'
import { IExamAccessAttemptRepository } from '../domain/repositories/exam-access-attempt.repository.js'

export class FakeExamAccessAttemptRepository extends IExamAccessAttemptRepository {
  readonly states = new Map<string, AttemptState>()

  get(scheduleId: string, studentId: string) {
    return Promise.resolve(
      this.states.get(`${scheduleId}:${studentId}`) ?? {
        failures: 0,
        lockedUntil: null,
      },
    )
  }

  registerFailure(scheduleId: string, studentId: string, now: Date) {
    const key = `${scheduleId}:${studentId}`
    const state = this.states.get(key) ?? { failures: 0, lockedUntil: null }
    this.states.set(key, nextAttemptState(state, now, false))
    return Promise.resolve()
  }

  clear(scheduleId: string, studentId: string) {
    this.states.delete(`${scheduleId}:${studentId}`)
    return Promise.resolve()
  }
}
