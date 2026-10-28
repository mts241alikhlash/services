import 'reflect-metadata'
import { plainToInstance } from 'class-transformer'
import { validateSync } from 'class-validator'
import { UpdateExamScheduleDto } from './exam-schedule-request.dto.js'

function errorsFor(body: Record<string, unknown>): string[] {
  return validateSync(plainToInstance(UpdateExamScheduleDto, body)).map(
    (error) => error.property,
  )
}

const valid = {
  startsAt: '2026-11-02T01:00:00.000Z',
  endsAt: '2026-11-02T04:00:00.000Z',
  durationMinutes: 90,
}

describe('UpdateExamScheduleDto', () => {
  it('accepts UTC and offset timestamps', () => {
    expect(errorsFor(valid)).toEqual([])
    expect(
      errorsFor({
        ...valid,
        startsAt: '2026-11-02T08:00:00+07:00',
        endsAt: '2026-11-02T11:00:00+07:00',
      }),
    ).toEqual([])
  })

  it('rejects a timestamp without a time zone', () => {
    expect(errorsFor({ ...valid, startsAt: '2026-11-02T08:00:00' })).toEqual([
      'startsAt',
    ])
    expect(errorsFor({ ...valid, endsAt: '2026-11-02T11:00' })).toEqual([
      'endsAt',
    ])
  })

  it('rejects a duration above 24 hours so it can never overflow the column', () => {
    expect(errorsFor({ ...valid, durationMinutes: 1441 })).toEqual([
      'durationMinutes',
    ])
    expect(errorsFor({ ...valid, durationMinutes: 2_147_483_648 })).toEqual([
      'durationMinutes',
    ])
  })
})
