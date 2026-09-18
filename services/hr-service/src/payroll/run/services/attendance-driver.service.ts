import { Injectable } from '@nestjs/common'
import { MonthlyPresenceSummary } from '../../../platform/presence-lookup/presence-lookup.port.js'

export type AttendanceDriverKey =
  | 'PRESENT_DAYS'
  | 'ABSENT_DAYS'
  | 'LATE_COUNT'
  | 'LATE_MINUTES'
  | 'EARLY_LEAVE_COUNT'
  | 'LEAVE_DAYS'
  | 'OFFICIAL_DUTY_DAYS'

@Injectable()
export class AttendanceDriverService {
  countFor(
    driver: AttendanceDriverKey,
    summary: MonthlyPresenceSummary,
  ): number {
    switch (driver) {
      case 'PRESENT_DAYS':
        return summary.presentDays
      case 'ABSENT_DAYS':
        return summary.absentDays
      case 'LATE_COUNT':
        return summary.lateCount
      case 'LATE_MINUTES':
        return summary.lateMinutes
      case 'EARLY_LEAVE_COUNT':
        return summary.earlyLeaveCount
      case 'LEAVE_DAYS':
        return summary.leaveDays
      case 'OFFICIAL_DUTY_DAYS':
        return summary.officialDutyDays
    }
  }

  blank(userId: string): MonthlyPresenceSummary {
    return {
      userId,
      presentDays: 0,
      absentDays: 0,
      lateCount: 0,
      lateMinutes: 0,
      earlyLeaveCount: 0,
      leaveDays: 0,
      officialDutyDays: 0,
    }
  }
}
