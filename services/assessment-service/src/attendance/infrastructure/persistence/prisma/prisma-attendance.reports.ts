import { PrismaService } from '../../../../core/database/prisma.service.js'
import { IEnrollmentLookupPort } from '../../../../platform/enrollment-lookup/enrollment-lookup.port.js'
import {
  AttendanceMonthlyTrendPoint,
  AttendanceRecapQueryInput,
  AttendanceStatusCounts,
  AttendanceTrendQueryInput,
} from '../../../domain/repositories/attendance.repository.js'

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
]

function calcPercentage(counts: {
  PRESENT: number
  LATE: number
  total: number
}): number {
  if (counts.total === 0) return 0
  return Math.round(((counts.PRESENT + counts.LATE) / counts.total) * 1000) / 10
}

export async function buildAttendanceRecap(
  prisma: PrismaService,
  enrollmentLookup: IEnrollmentLookupPort,
  query: AttendanceRecapQueryInput,
) {
  const { classroomId, semesterId, month, year } = query

  const dateRange =
    month && year
      ? {
          gte: new Date(year, month - 1, 1),
          lte: new Date(year, month, 0, 23, 59, 59, 999),
        }
      : undefined

  const enrollments = await enrollmentLookup.search({
    classroomId,
    semesterId,
  })
  if (enrollments.length === 0) return []

  const enrollmentById = new Map(enrollments.map((row) => [row.id, row]))

  const attendances = await prisma.attendance.findMany({
    where: {
      deletedAt: null,
      ...(dateRange && { date: dateRange }),
      enrollmentId: { in: enrollments.map((enrolment) => enrolment.id) },
    },
    select: { enrollmentId: true, status: true },
  })

  const recapMap = new Map<
    string,
    {
      enrollmentId: string
      studentName: string
      nis: string
      PRESENT: number
      SICK: number
      EXCUSED: number
      ABSENT: number
      LATE: number
    }
  >()

  for (const att of attendances) {
    if (!recapMap.has(att.enrollmentId)) {
      const enrolment = enrollmentById.get(att.enrollmentId)
      recapMap.set(att.enrollmentId, {
        enrollmentId: att.enrollmentId,
        studentName: enrolment?.studentName ?? '-',
        nis: enrolment?.studentNis ?? '',
        PRESENT: 0,
        SICK: 0,
        EXCUSED: 0,
        ABSENT: 0,
        LATE: 0,
      })
    }
    const entry = recapMap.get(att.enrollmentId)!
    entry[att.status]++
  }

  return Array.from(recapMap.values()).map((entry) => {
    const total =
      entry.PRESENT + entry.SICK + entry.EXCUSED + entry.ABSENT + entry.LATE
    return { ...entry, total, percentage: calcPercentage({ ...entry, total }) }
  })
}

export async function buildAttendanceStatusCounts(
  prisma: PrismaService,
  enrollmentId: string,
): Promise<AttendanceStatusCounts> {
  const grouped = await prisma.attendance.groupBy({
    by: ['status'],
    where: { enrollmentId, deletedAt: null },
    _count: { _all: true },
  })

  const counts: AttendanceStatusCounts = { sick: 0, excused: 0, absent: 0 }
  for (const group of grouped) {
    if (group.status === 'SICK') counts.sick = group._count._all
    else if (group.status === 'EXCUSED') counts.excused = group._count._all
    else if (group.status === 'ABSENT') counts.absent = group._count._all
  }
  return counts
}

export async function buildAttendanceMonthlyTrend(
  prisma: PrismaService,
  enrollmentLookup: IEnrollmentLookupPort,
  query: AttendanceTrendQueryInput,
) {
  const { classroomId, semesterId } = query

  const enrollments = await enrollmentLookup.search({
    classroomId,
    semesterId,
  })
  if (enrollments.length === 0) return []

  const attendances = await prisma.attendance.findMany({
    where: {
      deletedAt: null,
      enrollmentId: { in: enrollments.map((enrolment) => enrolment.id) },
    },
    select: { status: true, date: true },
  })

  const trendMap = new Map<
    string,
    Omit<AttendanceMonthlyTrendPoint, 'total' | 'percentage'>
  >()

  for (const att of attendances) {
    const year = att.date.getFullYear()
    const month = att.date.getMonth() + 1
    const key = `${year}-${month}`
    if (!trendMap.has(key)) {
      trendMap.set(key, {
        year,
        month,
        monthLabel: `${MONTH_LABELS[month - 1]} ${year}`,
        PRESENT: 0,
        SICK: 0,
        EXCUSED: 0,
        ABSENT: 0,
        LATE: 0,
      })
    }
    const entry = trendMap.get(key)!
    entry[att.status]++
  }

  return Array.from(trendMap.values())
    .map((entry) => {
      const total =
        entry.PRESENT + entry.SICK + entry.EXCUSED + entry.ABSENT + entry.LATE
      return {
        ...entry,
        total,
        percentage: calcPercentage({
          PRESENT: entry.PRESENT,
          LATE: entry.LATE,
          total,
        }),
      }
    })
    .sort((a, b) => a.year - b.year || a.month - b.month)
}
