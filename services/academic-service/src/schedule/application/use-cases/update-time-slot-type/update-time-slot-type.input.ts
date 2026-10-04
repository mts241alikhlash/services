import { DayEnum } from '../../../../shared/domain/enums/day.enum.js'

export interface UpdateTimeSlotTypeInput {
  code?: string
  name?: string
  isLesson?: boolean
  days?: DayEnum[]
  defaultDurationMinutes?: number
}
