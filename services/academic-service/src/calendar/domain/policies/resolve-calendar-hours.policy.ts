import { BadRequestException } from '@nestjs/common'

export function resolveCalendarHours(
  startTime?: string,
  endTime?: string,
): { startTime: Date | null; endTime: Date | null } {
  if (!startTime && !endTime) return { startTime: null, endTime: null }
  if (!startTime || !endTime) {
    throw new BadRequestException(
      'An entry with hours needs both a start and an end time.',
    )
  }
  if (endTime <= startTime) {
    throw new BadRequestException('endTime must be after startTime.')
  }
  return {
    startTime: new Date(`1970-01-01T${startTime}:00Z`),
    endTime: new Date(`1970-01-01T${endTime}:00Z`),
  }
}
