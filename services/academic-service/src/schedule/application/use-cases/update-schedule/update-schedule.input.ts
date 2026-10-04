import { DayEnum } from '../../../../shared/domain/enums/day.enum.js'

export interface UpdateScheduleInput {
  teachingAssignmentId?: string
  timeSlotId?: string
  day?: DayEnum
  room?: string
}
