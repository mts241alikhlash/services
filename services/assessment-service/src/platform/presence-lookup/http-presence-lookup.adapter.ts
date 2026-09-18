import { Injectable } from '@nestjs/common'
import { ServiceClient } from '../service-client/service-client.js'
import {
  GateSuggestion,
  IDailyPresenceReadPort,
  MonthlyPresenceSummary,
  PresenceDayStatusEnum,
} from './presence-lookup.port.js'

const URL_KEY = 'PRESENCE_SERVICE_URL'

const STATUSES: PresenceDayStatusEnum[] = [
  'PRESENT',
  'LATE',
  'ABSENT',
  'ON_LEAVE',
  'OFFICIAL_DUTY',
  'HOLIDAY',
]

@Injectable()
export class HttpPresenceLookupAdapter extends IDailyPresenceReadPort {
  constructor(private readonly client: ServiceClient) {
    super()
  }

  async findByUsersAndDate(
    userIds: string[],
    date: Date,
  ): Promise<GateSuggestion[]> {
    if (userIds.length === 0) return []

    const data = await this.client.postData(
      URL_KEY,
      '/daily-presences/by-users',
      { userIds, date: date.toISOString() },
    )
    if (!Array.isArray(data)) return this.client.malformed(URL_KEY)

    const rows: GateSuggestion[] = []
    for (const row of data) {
      const parsed = toSuggestion(row)
      if (!parsed) return this.client.malformed(URL_KEY)
      rows.push(parsed)
    }
    return rows
  }

  async summariseMonth(
    userIds: string[],
    year: number,
    month: number,
  ): Promise<MonthlyPresenceSummary[]> {
    if (userIds.length === 0) return []

    const data = await this.client.postData(
      URL_KEY,
      '/daily-presences/monthly-summary',
      { userIds, year, month },
    )
    if (!Array.isArray(data)) return this.client.malformed(URL_KEY)

    const rows: MonthlyPresenceSummary[] = []
    for (const row of data) {
      const parsed = toSummary(row)
      if (!parsed) return this.client.malformed(URL_KEY)
      rows.push(parsed)
    }
    return rows
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object'
}

function isStatus(value: unknown): value is PresenceDayStatusEnum {
  return typeof value === 'string' && (STATUSES as string[]).includes(value)
}

function toSuggestion(row: unknown): GateSuggestion | null {
  if (
    !isRecord(row) ||
    typeof row.userId !== 'string' ||
    !isStatus(row.status) ||
    typeof row.lateMinutes !== 'number'
  ) {
    return null
  }
  return {
    userId: row.userId,
    status: row.status,
    checkInAt:
      typeof row.checkInAt === 'string' ? new Date(row.checkInAt) : null,
    lateMinutes: row.lateMinutes,
  }
}

function toSummary(row: unknown): MonthlyPresenceSummary | null {
  if (!isRecord(row) || typeof row.userId !== 'string') return null

  const counts = [
    'presentDays',
    'absentDays',
    'lateCount',
    'lateMinutes',
    'earlyLeaveCount',
    'leaveDays',
    'officialDutyDays',
  ] as const
  for (const key of counts) {
    if (typeof row[key] !== 'number') return null
  }

  return {
    userId: row.userId,
    presentDays: row.presentDays as number,
    absentDays: row.absentDays as number,
    lateCount: row.lateCount as number,
    lateMinutes: row.lateMinutes as number,
    earlyLeaveCount: row.earlyLeaveCount as number,
    leaveDays: row.leaveDays as number,
    officialDutyDays: row.officialDutyDays as number,
  }
}
