import {
  ACADEMIC_YEAR_NAME_MAX_LENGTH,
  ACADEMIC_YEAR_START_YEAR_MAX,
  ACADEMIC_YEAR_START_YEAR_MIN,
} from '../../constants/academic-year.constants.js'
import { InvalidAcademicYearError } from '../errors/invalid-academic-year.error.js'

export function validateAcademicYearName(name: string): void {
  if (name.trim().length === 0) {
    throw new InvalidAcademicYearError('name must not be empty')
  }
  if (name.length > ACADEMIC_YEAR_NAME_MAX_LENGTH) {
    throw new InvalidAcademicYearError(
      `name cannot exceed ${ACADEMIC_YEAR_NAME_MAX_LENGTH} characters`,
    )
  }
}

export function validateAcademicYearStartYear(startYear: number): void {
  if (
    !Number.isInteger(startYear) ||
    startYear < ACADEMIC_YEAR_START_YEAR_MIN ||
    startYear > ACADEMIC_YEAR_START_YEAR_MAX
  ) {
    throw new InvalidAcademicYearError(
      `startYear must be an integer between ${ACADEMIC_YEAR_START_YEAR_MIN} and ${ACADEMIC_YEAR_START_YEAR_MAX}`,
    )
  }
}
