export abstract class IScheduleSessionGuard {
  abstract hasSessions(scheduleId: string): Promise<boolean>
  abstract idsWithSessions(scheduleIds: string[]): Promise<Set<string>>
}
