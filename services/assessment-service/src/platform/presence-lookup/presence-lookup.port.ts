export type PresenceDayStatusEnum =
  'PRESENT' | 'LATE' | 'ABSENT' | 'ON_LEAVE' | 'OFFICIAL_DUTY' | 'HOLIDAY'

export interface GateSuggestion {
  userId: string
  status: PresenceDayStatusEnum
  checkInAt: Date | null
  lateMinutes: number
}

export interface MonthlyPresenceSummary {
  userId: string
  presentDays: number
  absentDays: number
  lateCount: number
  lateMinutes: number
  earlyLeaveCount: number
  leaveDays: number
  officialDutyDays: number
}

export abstract class IDailyPresenceReadPort {
  abstract findByUsersAndDate(
    userIds: string[],
    date: Date,
  ): Promise<GateSuggestion[]>

  abstract summariseMonth(
    userIds: string[],
    year: number,
    month: number,
  ): Promise<MonthlyPresenceSummary[]>
}
