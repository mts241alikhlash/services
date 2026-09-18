import { DayEnum } from '../../shared/domain/enums/day.enum.js'

export const WEEKDAY_TO_SCHEDULE_DAY: readonly (DayEnum | null)[] = [
  null,
  DayEnum.MONDAY,
  DayEnum.TUESDAY,
  DayEnum.WEDNESDAY,
  DayEnum.THURSDAY,
  DayEnum.FRIDAY,
  DayEnum.SATURDAY,
]

export const LATEST_SCORE_LIMIT = 5
export const UNGRADED_ASSESSMENT_LIMIT = 5
export const SCHEDULE_CEILING = 200
