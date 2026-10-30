import { BadRequestException, NotFoundException } from '@nestjs/common'
import { FakeExamPackageRepository } from '../../../../exam-package/application/exam-package.repository.fake.js'
import { FakeExamSessionRepository } from '../../../../exam-session/application/exam-session.repository.fake.js'
import {
  NOW,
  FakeEnrollment,
  FakeStudentDirectory,
  choiceSpec,
  schedulePaper,
  sessionFor,
} from '../../../../exam-session/application/exam-session.test-support.js'
import { FakeQuestionRepository } from '../../../../question/application/question.repository.fake.js'
import { FakeExamScheduleRepository } from '../../exam-schedule.repository.fake.js'
import { CLASSROOM_7A, SEMESTER_ID } from '../../exam-schedule.test-support.js'
import { MakeupCandidatesService } from '../../makeup-candidates.service.js'
import { ListAbsenteesUseCase } from './list-absentees.use-case.js'

const ids = {
  ani: '31000000-0000-4000-8000-000000000001',
  budi: '31000000-0000-4000-8000-000000000002',
  citra: '31000000-0000-4000-8000-000000000003',
  dewi: '31000000-0000-4000-8000-000000000004',
}

const enrollment = (studentId: string) => ({
  id: `enr-${studentId}`,
  studentId,
  classroomId: CLASSROOM_7A.id,
  semesterId: SEMESTER_ID,
})

describe('ListAbsenteesUseCase', () => {
  async function setup() {
    const packages = new FakeExamPackageRepository()
    const schedules = new FakeExamScheduleRepository(packages)
    const questions = new FakeQuestionRepository()
    const sessions = new FakeExamSessionRepository()
    const { schedule } = await schedulePaper(
      { packages, schedules, questions },
      [choiceSpec('B')],
    )
    const enrollments = new FakeEnrollment({
      roster: Object.values(ids).map(enrollment),
    })
    const directory = new FakeStudentDirectory([
      { id: ids.ani, nis: '1', name: 'Ani' },
      { id: ids.budi, nis: '2', name: 'Budi' },
      { id: ids.citra, nis: '3', name: 'Citra' },
      { id: ids.dewi, nis: '4', name: 'Dewi' },
    ])
    const useCase = new ListAbsenteesUseCase(
      schedules,
      new MakeupCandidatesService(enrollments, sessions, schedules),
      directory,
    )
    return { schedule, schedules, sessions, useCase }
  }

  it('lists the roster by name with who can sit a makeup and why not', async () => {
    const { schedule, schedules, sessions, useCase } = await setup()
    sessions.sessions.set(
      'a',
      sessionFor(schedule, {
        id: 'a',
        studentId: ids.budi,
        status: 'SUBMITTED',
        submittedAt: NOW,
      }),
    )
    sessions.sessions.set(
      'b',
      sessionFor(schedule, { id: 'b', studentId: ids.citra }),
    )
    await schedules.createMakeup({
      packageId: schedule.packageId,
      classroomId: schedule.classroomId,
      semesterId: schedule.semesterId,
      startsAt: new Date(schedule.endsAt.getTime() + 86_400_000),
      endsAt: new Date(schedule.endsAt.getTime() + 2 * 86_400_000),
      durationMinutes: 90,
      type: schedule.type,
      createdById: schedule.createdById,
      makeupOfId: schedule.id,
      participants: [{ studentId: ids.dewi, reason: 'SICK', note: null }],
    })

    const rows = await useCase.execute(schedule.id, NOW)

    expect(rows.map((row) => [row.name, row.eligibility])).toEqual([
      ['Ani', { eligible: true }],
      ['Budi', { eligible: false, reason: 'ALREADY_SAT' }],
      ['Citra', { eligible: false, reason: 'IN_PROGRESS' }],
      ['Dewi', { eligible: false, reason: 'ON_LIVE_MAKEUP' }],
    ])
  })

  it('does not count a makeup that was cancelled or already ended', async () => {
    const { schedule, schedules, useCase } = await setup()
    const makeup = await schedules.createMakeup({
      packageId: schedule.packageId,
      classroomId: schedule.classroomId,
      semesterId: schedule.semesterId,
      startsAt: new Date('2026-11-03T01:00:00Z'),
      endsAt: new Date('2026-11-03T03:00:00Z'),
      durationMinutes: 90,
      type: schedule.type,
      createdById: schedule.createdById,
      makeupOfId: schedule.id,
      participants: [{ studentId: ids.dewi, reason: 'SICK', note: null }],
    })
    await schedules.cancel(makeup?.id ?? '')

    const rows = await useCase.execute(schedule.id, NOW)

    expect(rows.find((row) => row.name === 'Dewi')?.eligibility).toEqual({
      eligible: true,
    })
  })

  it('refuses a missing schedule and a makeup schedule', async () => {
    const { schedule, schedules, useCase } = await setup()
    const makeup = await schedules.createMakeup({
      packageId: schedule.packageId,
      classroomId: schedule.classroomId,
      semesterId: schedule.semesterId,
      startsAt: new Date('2026-11-03T01:00:00Z'),
      endsAt: new Date('2026-11-03T03:00:00Z'),
      durationMinutes: 90,
      type: schedule.type,
      createdById: schedule.createdById,
      makeupOfId: schedule.id,
      participants: [{ studentId: ids.ani, reason: 'SICK', note: null }],
    })

    await expect(useCase.execute('missing', NOW)).rejects.toThrow(
      NotFoundException,
    )
    await expect(useCase.execute(makeup?.id ?? '', NOW)).rejects.toThrow(
      BadRequestException,
    )
  })

  it('keeps out a student who already sat an earlier makeup that has ended', async () => {
    const { schedule, schedules, sessions, useCase } = await setup()
    const first = await schedules.createMakeup({
      packageId: schedule.packageId,
      classroomId: schedule.classroomId,
      semesterId: schedule.semesterId,
      startsAt: new Date('2026-11-03T01:00:00Z'),
      endsAt: new Date('2026-11-03T03:00:00Z'),
      durationMinutes: 90,
      type: schedule.type,
      createdById: schedule.createdById,
      makeupOfId: schedule.id,
      participants: [
        { studentId: ids.ani, reason: 'SICK', note: null },
        { studentId: ids.budi, reason: 'SICK', note: null },
      ],
    })
    sessions.sessions.set(
      'm',
      sessionFor(first!, {
        id: 'm',
        studentId: ids.ani,
        status: 'SUBMITTED',
        submittedAt: NOW,
      }),
    )

    const rows = await useCase.execute(
      schedule.id,
      new Date('2026-11-04T00:00:00Z'),
    )

    expect(rows.find((row) => row.name === 'Ani')?.eligibility).toEqual({
      eligible: false,
      reason: 'ALREADY_SAT',
    })
    expect(rows.find((row) => row.name === 'Budi')?.eligibility).toEqual({
      eligible: true,
    })
  })

  it('lets a student whose regular session was closed by the clock with no answers sit a makeup', async () => {
    const { schedule, sessions, useCase } = await setup()
    sessions.sessions.set(
      'g',
      sessionFor(schedule, { id: 'g', studentId: ids.ani, status: 'GRADED' }),
    )

    const rows = await useCase.execute(schedule.id, NOW)

    expect(rows.find((row) => row.name === 'Ani')?.eligibility).toEqual({
      eligible: true,
    })
  })
})
