import { PrismaService } from '../../../../core/database/prisma.service.js'
import { IProfileLookupPort } from '../../../../platform/profile-lookup/profile-lookup.port.js'
import { PresenceSubjectTypeEnum } from '../../../credential/domain/entities/credential.entity.js'
import {
  PresenceRecapRow,
  RecapQueryInput,
} from '../../domain/interfaces/daily-presence-recap.interface.js'

export function monthBounds(year: number, month: number) {
  return {
    from: new Date(Date.UTC(year, month - 1, 1)),
    to: new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)),
  }
}

function blankRow(
  userId: string,
  displayName: string | null,
): PresenceRecapRow {
  return {
    userId,
    displayName,
    presentDays: 0,
    absentDays: 0,
    lateCount: 0,
    lateMinutes: 0,
    earlyLeaveCount: 0,
    leaveDays: 0,
    officialDutyDays: 0,
    attendanceRate: 0,
  }
}

export async function getPresenceRecap(
  prisma: PrismaService,
  profileLookupPort: IProfileLookupPort,
  query: RecapQueryInput,
): Promise<PresenceRecapRow[]> {
  const { year, month } = query
  const { from, to } = monthBounds(year, month)
  const subjectType: PresenceSubjectTypeEnum = query.subjectType ?? 'EMPLOYEE'

  const roster = await prisma.presenceCredential.findMany({
    where: {
      status: 'ACTIVE',
      deletedAt: null,
      subjectType,
      ...(query.userId && { userId: query.userId }),
    },
    select: { userId: true },
  })

  const profiles = await profileLookupPort.findByUserIds(
    roster.map((entry) => entry.userId),
  )
  const nameByUserId = new Map(profiles.map((p) => [p.userId, p.name]))

  const rows = new Map<string, PresenceRecapRow>(
    roster.map((entry) => [
      entry.userId,
      blankRow(entry.userId, nameByUserId.get(entry.userId) ?? null),
    ]),
  )

  if (rows.size === 0) return []

  const records = await prisma.dailyPresence.findMany({
    where: {
      userId: { in: [...rows.keys()] },
      date: { gte: from, lte: to },
      deletedAt: null,
    },
    select: {
      userId: true,
      status: true,
      lateMinutes: true,
      earlyLeaveMinutes: true,
    },
  })

  for (const record of records) {
    const row = rows.get(record.userId)
    if (!row) continue

    if (record.status === 'PRESENT' || record.status === 'LATE') {
      row.presentDays++
    }
    if (record.status === 'ABSENT') row.absentDays++
    if (record.status === 'LATE') row.lateCount++
    if (record.status === 'ON_LEAVE') row.leaveDays++
    if (record.status === 'OFFICIAL_DUTY') row.officialDutyDays++
    if (record.earlyLeaveMinutes > 0) row.earlyLeaveCount++

    row.lateMinutes += record.lateMinutes
  }

  return [...rows.values()].map(withRate).sort(byName)
}

function withRate(row: PresenceRecapRow): PresenceRecapRow {
  const expected = row.presentDays + row.absentDays
  return {
    ...row,
    attendanceRate:
      expected === 0 ? 0 : Math.round((row.presentDays / expected) * 1000) / 10,
  }
}

function byName(a: PresenceRecapRow, b: PresenceRecapRow): number {
  return (a.displayName ?? '').localeCompare(b.displayName ?? '')
}

export async function countWorkingDays(
  prisma: PrismaService,
  year: number,
  month: number,
): Promise<number> {
  const { from, to } = monthBounds(year, month)

  const [pattern, holidays] = await Promise.all([
    prisma.workPattern.findFirst({
      where: { isDefault: true, deletedAt: null },
      include: { days: true },
    }),
    prisma.nonWorkingDay.count({
      where: { date: { gte: from, lte: to }, deletedAt: null },
    }),
  ])

  if (!pattern) return 0

  const working = new Set(
    pattern.days.filter((day) => day.isWorkingDay).map((day) => day.weekday),
  )

  let count = 0
  for (
    let day = new Date(from);
    day <= to;
    day.setUTCDate(day.getUTCDate() + 1)
  ) {
    if (working.has(day.getUTCDay())) count++
  }

  return Math.max(0, count - holidays)
}
