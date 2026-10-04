import { DayEnum } from '../../../../shared/domain/enums/day.enum.js'
import { PaginationQueryInput } from '../../../../shared/domain/interfaces/repository.interface.js'

export interface GetSchedulesInput extends PaginationQueryInput {
  teachingAssignmentId?: string
  day?: DayEnum
  timeSlotId?: string
}
