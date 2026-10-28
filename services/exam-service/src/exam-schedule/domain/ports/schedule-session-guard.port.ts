export abstract class IScheduleSessionGuard {
  abstract hasSessions(scheduleId: string): Promise<boolean>
}
