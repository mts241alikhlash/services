import { BadRequestException } from '@nestjs/common'
import {
  assertWindowNotPast,
  validateScheduleWindow,
} from './validate-schedule-window.policy.js'

const start = new Date('2026-11-02T01:00:00.000Z')
const end = new Date('2026-11-02T04:00:00.000Z')

describe('validateScheduleWindow', () => {
  it('accepts a duration that fits inside the window', () => {
    expect(() =>
      validateScheduleWindow({
        startsAt: start,
        endsAt: end,
        durationMinutes: 90,
      }),
    ).not.toThrow()
  })

  it('accepts a duration that fills the whole window', () => {
    expect(() =>
      validateScheduleWindow({
        startsAt: start,
        endsAt: end,
        durationMinutes: 180,
      }),
    ).not.toThrow()
  })

  it('rejects a window that ends before it starts', () => {
    expect(() =>
      validateScheduleWindow({
        startsAt: end,
        endsAt: start,
        durationMinutes: 90,
      }),
    ).toThrow(BadRequestException)
  })

  it('rejects an empty window', () => {
    expect(() =>
      validateScheduleWindow({
        startsAt: start,
        endsAt: start,
        durationMinutes: 1,
      }),
    ).toThrow('Waktu selesai harus setelah waktu mulai')
  })

  it('rejects a zero duration', () => {
    expect(() =>
      validateScheduleWindow({
        startsAt: start,
        endsAt: end,
        durationMinutes: 0,
      }),
    ).toThrow('Durasi minimal 1 menit')
  })

  it('rejects a duration with a fraction', () => {
    expect(() =>
      validateScheduleWindow({
        startsAt: start,
        endsAt: end,
        durationMinutes: 90.5,
      }),
    ).toThrow('Durasi minimal 1 menit')
  })

  it('rejects a duration longer than the window', () => {
    expect(() =>
      validateScheduleWindow({
        startsAt: start,
        endsAt: end,
        durationMinutes: 181,
      }),
    ).toThrow('Durasi tidak boleh lebih panjang dari jendela ujian')
  })

  it('rejects an invalid date', () => {
    expect(() =>
      validateScheduleWindow({
        startsAt: new Date('not a date'),
        endsAt: end,
        durationMinutes: 60,
      }),
    ).toThrow('Waktu mulai dan selesai harus valid')
  })

  it('rejects a duration longer than 24 hours', () => {
    expect(() =>
      validateScheduleWindow({
        startsAt: start,
        endsAt: new Date('2026-11-05T01:00:00.000Z'),
        durationMinutes: 1441,
      }),
    ).toThrow('Durasi maksimal 24 jam')
  })

  it('rejects a window longer than 14 days', () => {
    expect(() =>
      validateScheduleWindow({
        startsAt: start,
        endsAt: new Date('2026-11-16T01:00:01.000Z'),
        durationMinutes: 60,
      }),
    ).toThrow('Jendela ujian maksimal 14 hari')
  })

  it('accepts a window of exactly 14 days', () => {
    expect(() =>
      validateScheduleWindow({
        startsAt: start,
        endsAt: new Date('2026-11-16T01:00:00.000Z'),
        durationMinutes: 60,
      }),
    ).not.toThrow()
  })
})

describe('assertWindowNotPast', () => {
  it('rejects a window that has already ended', () => {
    expect(() =>
      assertWindowNotPast(
        { endsAt: end },
        new Date('2026-11-02T04:00:01.000Z'),
      ),
    ).toThrow('Jendela ujian sudah lewat')
  })

  it('accepts a window that ends in the future', () => {
    expect(() =>
      assertWindowNotPast(
        { endsAt: end },
        new Date('2026-11-02T03:59:59.000Z'),
      ),
    ).not.toThrow()
  })
})
