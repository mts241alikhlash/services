import { IScheduleSessionGuard } from '../domain/ports/schedule-session-guard.port.js'

export class FakeScheduleSessionGuard extends IScheduleSessionGuard {
  readonly withSessions = new Set<string>()

  hasSessions(scheduleId: string) {
    return Promise.resolve(this.withSessions.has(scheduleId))
  }
}
