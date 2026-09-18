import { InvalidSemesterError } from '../errors/invalid-semester.error.js'

export function validateSemesterDateRange(
  startDate: Date | null | undefined,
  endDate: Date | null | undefined,
): void {
  if (startDate && endDate && endDate <= startDate) {
    throw new InvalidSemesterError('End date must be after start date')
  }
}
