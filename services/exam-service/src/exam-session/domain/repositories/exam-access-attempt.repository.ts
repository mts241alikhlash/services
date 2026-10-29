import type { AttemptState } from '../policies/access-attempt.policy.js'

export abstract class IExamAccessAttemptRepository {
  abstract get(scheduleId: string, studentId: string): Promise<AttemptState>
  abstract registerFailure(
    scheduleId: string,
    studentId: string,
    now: Date,
  ): Promise<void>
  abstract clear(scheduleId: string, studentId: string): Promise<void>
}
