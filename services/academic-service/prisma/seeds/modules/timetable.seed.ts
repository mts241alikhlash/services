import { Day, PrismaClient } from '@prisma/client'

const TEACHING_DAYS: Day[] = [
  Day.MONDAY,
  Day.TUESDAY,
  Day.WEDNESDAY,
  Day.THURSDAY,
  Day.FRIDAY,
  Day.SATURDAY,
]

export interface TimetablePeriod {
  id: string
  startMinutes: number
  endMinutes: number
  isLesson: boolean
  days: Day[]
}

const happensOn = (period: TimetablePeriod, day: Day) =>
  period.days.length === 0 || period.days.includes(day)

const overlaps = (a: TimetablePeriod, b: TimetablePeriod) =>
  a.startMinutes < b.endMinutes && b.startMinutes < a.endMinutes

export function blockedLessonPeriods(
  periods: TimetablePeriod[],
  days: Day[],
): Map<Day, Set<string>> {
  const lessons = periods.filter((p) => p.isLesson)
  const interruptions = periods.filter((p) => !p.isLesson)

  return new Map(
    days.map((day) => [
      day,
      new Set(
        lessons
          .filter(
            (lesson) =>
              happensOn(lesson, day) &&
              interruptions.some(
                (other) => happensOn(other, day) && overlaps(lesson, other),
              ),
          )
          .map((lesson) => lesson.id),
      ),
    ]),
  )
}

export interface TimetableRow {
  assignmentId: string
  day: Day
  timeSlotId: string
}

export interface ClassTimetableInput {
  classroomId: string
  assignments: { id: string; employeeId: string }[]
}

export function buildTimetable(
  classes: ClassTimetableInput[],
  days: Day[],
  lessonSlotIds: string[],
  blockedByDay = new Map<Day, Set<string>>(),
): TimetableRow[] {
  const rows: TimetableRow[] = []
  const employeeBusy = new Set<string>()
  const busyKey = (employeeId: string, day: Day, slotId: string) =>
    `${employeeId}|${day}|${slotId}`

  for (const cls of classes) {
    const taught = new Map(cls.assignments.map((a) => [a.id, 0]))
    const employeeOf = new Map(cls.assignments.map((a) => [a.id, a.employeeId]))
    const placedToday = new Map<Day, Set<string>>(
      days.map((d) => [d, new Set()]),
    )

    for (const slotId of lessonSlotIds) {
      for (const day of days) {
        if (blockedByDay.get(day)?.has(slotId)) continue

        const today = placedToday.get(day)!

        const candidate = [...taught.entries()]
          .filter(([id]) => !today.has(id))
          .filter(
            ([id]) =>
              !employeeBusy.has(busyKey(employeeOf.get(id)!, day, slotId)),
          )
          .sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]))[0]

        if (!candidate) continue

        const [assignmentId] = candidate
        rows.push({ assignmentId, day, timeSlotId: slotId })
        taught.set(assignmentId, taught.get(assignmentId)! + 1)
        today.add(assignmentId)
        employeeBusy.add(busyKey(employeeOf.get(assignmentId)!, day, slotId))
      }
    }
  }

  return rows
}

export async function seedTimetable(
  prisma: PrismaClient,
  semesterId: string,
  classrooms: { id: string; code: string }[],
  periods: TimetablePeriod[],
) {
  const lessonSlotIds = periods.filter((p) => p.isLesson).map((p) => p.id)
  if (lessonSlotIds.length === 0) {
    console.log('  no lesson periods to timetable on, skipping')
    return
  }

  const blockedByDay = blockedLessonPeriods(periods, TEACHING_DAYS)

  const assignments = await prisma.teachingAssignment.findMany({
    where: {
      deletedAt: null,
      semesterId,
      classroomId: { in: classrooms.map((c) => c.id) },
    },
    select: { id: true, employeeId: true, classroomId: true },
    orderBy: { id: 'asc' },
  })

  const rows = buildTimetable(
    classrooms.map((classroom) => ({
      classroomId: classroom.id,
      assignments: assignments
        .filter((a) => a.classroomId === classroom.id)
        .map((a) => ({ id: a.id, employeeId: a.employeeId })),
    })),
    TEACHING_DAYS,
    lessonSlotIds,
    blockedByDay,
  )

  const roomOf = new Map(classrooms.map((c) => [c.id, c.code]))
  const classroomOf = new Map(assignments.map((a) => [a.id, a.classroomId]))

  await prisma.$transaction([
    prisma.schedule.deleteMany({
      where: { teachingAssignmentId: { in: assignments.map((a) => a.id) } },
    }),
    prisma.schedule.createMany({
      data: rows.map((row) => ({
        teachingAssignmentId: row.assignmentId,
        timeSlotId: row.timeSlotId,
        day: row.day,
        room: roomOf.get(classroomOf.get(row.assignmentId)!) ?? '-',
      })),
    }),
  ])

  const freePerClass = TEACHING_DAYS.reduce(
    (n, day) =>
      n + lessonSlotIds.filter((id) => !blockedByDay.get(day)?.has(id)).length,
    0,
  )
  const capacity = freePerClass * classrooms.length
  console.log(
    `  ${rows.length} of ${capacity} periods filled — ${assignments.length} ` +
      `subjects across ${classrooms.length} classes, ` +
      `${freePerClass} teaching periods a week each`,
  )
  if (rows.length < capacity) {
    console.log(
      `  ${capacity - rows.length} left empty: no subject whose employee was free`,
    )
  }
}
