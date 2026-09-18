import { DayEnum } from '../../../../shared/domain/enums/day.enum.js'

export interface BatchScheduleRowInput {
  timeSlotId: string
  subjectId: string
}

export interface BatchUpsertScheduleInput {
  day: DayEnum
  lessons: BatchScheduleRowInput[]
}
