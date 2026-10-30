import type { GradingSchedule } from '../../../application/use-cases/list-grading-schedules/list-grading-schedules.use-case.js'
import { GradingScheduleDto } from './grading-response.dto.js'

describe('GradingScheduleDto', () => {
  it('tells the exam type with the schedule', () => {
    const schedule = {
      id: 's1',
      packageTitle: 'Bilangan',
      subjectId: 'subject-1',
      classroomId: 'c1',
      classroomName: 'VII A',
      semesterId: 'sem',
      type: 'UTS',
      startsAt: new Date('2026-11-02T01:00:00.000Z'),
      endsAt: new Date('2026-11-02T03:00:00.000Z'),
      sessions: 3,
      awaitingGrading: 1,
      graded: 2,
    } as GradingSchedule

    expect(GradingScheduleDto.fromDomain(schedule).type).toBe('UTS')
  })

  it('marks the title of a makeup', () => {
    const base = {
      id: 's2',
      packageTitle: 'Bilangan',
      subjectId: 'subject-1',
      classroomId: 'c1',
      classroomName: 'VII A',
      semesterId: 'sem',
      type: 'UTS',
      startsAt: new Date('2026-11-05T01:00:00.000Z'),
      endsAt: new Date('2026-11-05T03:00:00.000Z'),
      sessions: 1,
      awaitingGrading: 0,
      graded: 1,
    }

    expect(
      GradingScheduleDto.fromDomain({
        ...base,
        kind: 'MAKEUP',
      } as GradingSchedule).title,
    ).toBe('Bilangan (Susulan)')
    expect(
      GradingScheduleDto.fromDomain({
        ...base,
        kind: 'REGULAR',
      } as GradingSchedule).title,
    ).toBe('Bilangan')
  })
})
