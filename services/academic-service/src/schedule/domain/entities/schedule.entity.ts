import {
  ClassroomRef,
  SubjectRef,
} from '../../../shared/domain/entities/index.js'
import type { EmployeePersonRef } from '../../../shared/utils/resolve-person-refs.helper.js'
import { DayEnum } from '../../../shared/domain/enums/day.enum.js'

export interface ScheduleEntity {
  id: string
  teachingAssignmentId: string
  timeSlotId: string
  day: DayEnum | string
  deletedAt?: Date | null
}

export interface ScheduleWithDetails extends ScheduleEntity {
  teachingAssignment?: {
    id: string
    employeeId: string
    classroomId: string
    subjectId: string
    semesterId: string
    subject?: SubjectRef
    classroom?: ClassroomRef
    employee?: EmployeePersonRef
  }
  timeSlot?: {
    id: string
    name: string
    startTime: Date
    endTime: Date
    order: number
    typeId: string
  }
}
