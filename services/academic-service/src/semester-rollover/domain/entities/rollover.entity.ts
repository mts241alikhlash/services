import { DayEnum } from '../../../shared/domain/enums/day.enum.js'

export interface RolloverSemesterRef {
  id: string
  academicYearId: string
  typeId: string
}

export interface ClassroomRolloverEntity {
  id: string
  gradeId: string
  code: string
  name: string | null
  capacity: number
  isActive: boolean
}

export interface ClassroomSupervisorRolloverEntity {
  id: string
  classroomId: string
  employeeId: string
}

export interface ScheduleRolloverEntity {
  id: string
  day: `${DayEnum}`
  timeSlotId: string
  room?: string | null
}

export interface TeachingAssignmentRolloverEntity {
  id: string
  employeeId: string
  classroomId: string
  subjectId: string
  schedules: ScheduleRolloverEntity[]
}
