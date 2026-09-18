import { BadRequestException } from '@nestjs/common'
import { resolveCalendarHours } from './resolve-calendar-hours.policy.js'

describe('resolveCalendarHours', () => {
  it('stores the hours an activity names', () => {
    const result = resolveCalendarHours('08:00', '12:00')

    expect(result.startTime?.toISOString()).toContain('08:00:00')
    expect(result.endTime?.toISOString()).toContain('12:00:00')
  })

  it('leaves an entry measured in days without hours', () => {
    expect(resolveCalendarHours()).toEqual({
      startTime: null,
      endTime: null,
    })
  })

  it('refuses a start with no end', () => {
    expect(() => resolveCalendarHours('08:00')).toThrow(BadRequestException)
  })

  it('refuses an end with no start', () => {
    expect(() => resolveCalendarHours(undefined, '12:00')).toThrow(
      BadRequestException,
    )
  })

  it('refuses an end that is not after the start', () => {
    expect(() => resolveCalendarHours('12:00', '08:00')).toThrow(
      BadRequestException,
    )
  })

  it('refuses a zero-length span', () => {
    expect(() => resolveCalendarHours('08:00', '08:00')).toThrow(
      BadRequestException,
    )
  })
})
