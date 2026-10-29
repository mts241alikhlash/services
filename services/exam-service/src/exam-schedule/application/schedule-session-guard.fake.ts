import { IScheduleSessionGuard } from '../domain/ports/schedule-session-guard.port.js'

export class FakeScheduleSessionGuard extends IScheduleSessionGuard {
  readonly withSessions = new Set<string>()

  idsWithSessions(scheduleIds: string[]) {
    return Promise.resolve(
      new Set(scheduleIds.filter((id) => this.withSessions.has(id))),
    )
  }

  hasSessions(scheduleId: string) {
    return Promise.resolve(this.withSessions.has(scheduleId))
  }
}
