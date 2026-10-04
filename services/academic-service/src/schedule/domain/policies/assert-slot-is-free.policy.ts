import { ConflictException } from '@nestjs/common'
import { DayEnum } from '../../../shared/domain/enums/day.enum.js'
import {
  IScheduleRepository,
  ScheduleWithDetails,
} from '../repositories/schedule.repository.js'

export interface PlannedLesson {
  employeeId: string
  classroomId: string
  semesterId: string
  timeSlotId: string
  day: DayEnum
}

const DAY_NAMES: Record<string, string> = {
  MONDAY: 'Senin',
  TUESDAY: 'Selasa',
  WEDNESDAY: 'Rabu',
  THURSDAY: 'Kamis',
  FRIDAY: 'Jumat',
  SATURDAY: 'Sabtu',
  SUNDAY: 'Minggu',
}

function describe(row: ScheduleWithDetails): string {
  const subject = row.teachingAssignment?.subject?.name ?? 'pelajaran lain'
  const classroom = row.teachingAssignment?.classroom?.code
  const day = DAY_NAMES[row.day] ?? row.day
  const slot = row.timeSlot?.name ?? 'jam tersebut'
  return `${subject}${classroom ? ` (${classroom})` : ''} hari ${day} ${slot}`
}

export async function assertSlotIsFree(
  schedules: IScheduleRepository,
  lesson: PlannedLesson,
  excludeScheduleId?: string,
): Promise<void> {
  const [classroomClash, employeeClash] = await Promise.all([
    schedules.findClassroomConflictingSchedule(
      lesson.classroomId,
      lesson.semesterId,
      lesson.timeSlotId,
      lesson.day,
      excludeScheduleId,
    ),
    schedules.findEmployeeConflictingSchedule(
      lesson.employeeId,
      lesson.semesterId,
      lesson.timeSlotId,
      lesson.day,
      excludeScheduleId,
    ),
  ])

  if (classroomClash) {
    throw new ConflictException(
      `Kelas ini sudah ada pelajaran pada jam tersebut: ${describe(classroomClash)}.`,
    )
  }

  if (employeeClash) {
    const employee =
      employeeClash.teachingAssignment?.employee?.user?.profile?.name ??
      'Guru ini'
    throw new ConflictException(
      `${employee} sudah mengajar pada jam tersebut: ${describe(employeeClash)}.`,
    )
  }
}
