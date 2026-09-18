import {
  WEEKDAY_COUNT,
  WEEKDAY_MAX,
  WEEKDAY_MIN,
} from '../../constants/weekday.constants.js'
import {
  PASSING_SCORE_MAX,
  PASSING_SCORE_MIN,
} from '../../constants/passing-score.constants.js'
import { InvalidAcademicSettingError } from '../errors/invalid-academic-setting.error.js'

export interface AcademicSettingProps {
  id: string
  weeklyHolidays: number[]
  defaultPassingScore: number
  createdAt: Date
  updatedAt: Date
}

export class AcademicSetting {
  readonly id: string
  readonly weeklyHolidays: number[]
  readonly defaultPassingScore: number
  readonly createdAt: Date
  readonly updatedAt: Date

  private constructor(props: AcademicSettingProps) {
    this.id = props.id
    this.weeklyHolidays = props.weeklyHolidays
    this.defaultPassingScore = props.defaultPassingScore
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt
  }

  static reconstitute(props: AcademicSettingProps): AcademicSetting {
    return new AcademicSetting(props)
  }

  withUpdate(input: {
    weeklyHolidays?: number[]
    defaultPassingScore?: number
  }): AcademicSetting {
    const weeklyHolidays = input.weeklyHolidays ?? this.weeklyHolidays
    const defaultPassingScore =
      input.defaultPassingScore ?? this.defaultPassingScore

    AcademicSetting.validateWeeklyHolidays(weeklyHolidays)
    AcademicSetting.validateDefaultPassingScore(defaultPassingScore)

    return new AcademicSetting({
      id: this.id,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      weeklyHolidays,
      defaultPassingScore,
    })
  }

  private static validateWeeklyHolidays(weeklyHolidays: number[]): void {
    if (weeklyHolidays.length > WEEKDAY_COUNT) {
      throw new InvalidAcademicSettingError(
        `weeklyHolidays cannot list more than ${WEEKDAY_COUNT} days`,
      )
    }
    if (new Set(weeklyHolidays).size !== weeklyHolidays.length) {
      throw new InvalidAcademicSettingError(
        'weeklyHolidays must not repeat a day',
      )
    }
    for (const day of weeklyHolidays) {
      if (!Number.isInteger(day) || day < WEEKDAY_MIN || day > WEEKDAY_MAX) {
        throw new InvalidAcademicSettingError(
          `weeklyHolidays entries must be integers between ${WEEKDAY_MIN} and ${WEEKDAY_MAX}`,
        )
      }
    }
  }

  private static validateDefaultPassingScore(score: number): void {
    if (
      !Number.isInteger(score) ||
      score < PASSING_SCORE_MIN ||
      score > PASSING_SCORE_MAX
    ) {
      throw new InvalidAcademicSettingError(
        `defaultPassingScore must be an integer between ${PASSING_SCORE_MIN} and ${PASSING_SCORE_MAX}`,
      )
    }
  }
}
