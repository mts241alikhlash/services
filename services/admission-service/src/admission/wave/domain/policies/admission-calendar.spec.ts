import { admissionToday } from './admission-calendar.js'

describe('admissionToday', () => {
  it('is the calendar date in Jakarta, as a date column stores it', () => {
    expect(admissionToday(new Date('2026-02-01T15:00:00+07:00'))).toEqual(
      new Date('2026-02-01T00:00:00.000Z'),
    )
  })

  it('has already turned over in Jakarta while UTC is still on the day before', () => {
    expect(admissionToday(new Date('2026-02-01T00:30:00+07:00'))).toEqual(
      new Date('2026-02-01T00:00:00.000Z'),
    )
  })

  it('stays on the same date until midnight in Jakarta', () => {
    expect(admissionToday(new Date('2026-02-01T23:59:00+07:00'))).toEqual(
      new Date('2026-02-01T00:00:00.000Z'),
    )
  })
})
