import { DayEnum } from '../../../../shared/domain/enums/day.enum.js'

export interface CreateScheduleInput {
  teachingAssignmentId: string
  timeSlotId: string
  day: DayEnum
  room?: string
}
