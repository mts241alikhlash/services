import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'
import { FakeExamPackageRepository } from '../../../../exam-package/application/exam-package.repository.fake.js'
import { USER } from '../../../../exam-package/application/exam-package.test-support.js'
import { FakeExamSessionRepository } from '../../../../exam-session/application/exam-session.repository.fake.js'
import {
  FakeEnrollment,
  FakeStudentDirectory,
  NOW,
  choiceSpec,
  schedulePaper,
  sessionFor,
} from '../../../../exam-session/application/exam-session.test-support.js'
import { FakeQuestionRepository } from '../../../../question/application/question.repository.fake.js'
import { FakeExamScheduleRepository } from '../../exam-schedule.repository.fake.js'
import { CLASSROOM_7A, SEMESTER_ID } from '../../exam-schedule.test-support.js'
import { MakeupCandidatesService } from '../../makeup-candidates.service.js'
import { MakeupParticipantsService } from '../../makeup-participants.service.js'
import { AddMakeupParticipantsUseCase } from './add-makeup-participants.use-case.js'
import { GetMakeupParticipantsUseCase } from './get-makeup-participants.use-case.js'
import { RemoveMakeupParticipantUseCase } from './remove-makeup-participant.use-case.js'

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

const person = (studentId: string) => ({
  studentId,
  reason: 'SICK' as const,
  note: null,
})

describe('makeup participants', () => {
  async function setup() {
    const packages = new FakeExamPackageRepository()
    const schedules = new FakeExamScheduleRepository(packages)
    const questions = new FakeQuestionRepository()
    const sessions = new FakeExamSessionRepository()
    const { schedule } = await schedulePaper(
      { packages, schedules, questions },
      [choiceSpec('B')],
    )
    const makeup = await schedules.createMakeup({
      packageId: schedule.packageId,
      classroomId: schedule.classroomId,
      semesterId: schedule.semesterId,
      startsAt: new Date('2026-11-05T01:00:00.000Z'),
      endsAt: new Date('2026-11-05T04:00:00.000Z'),
      durationMinutes: 90,
      type: schedule.type,
      createdById: USER.id,
      makeupOfId: schedule.id,
      participants: [person(ids.ani), person(ids.budi)],
    })
    if (makeup === null) throw new Error('makeup not created')
    const directory = new FakeStudentDirectory([
      { id: ids.ani, nis: '1', name: 'Ani' },
      { id: ids.budi, nis: '2', name: 'Budi' },
      { id: ids.citra, nis: '3', name: 'Citra' },
      { id: ids.dewi, nis: '4', name: 'Dewi' },
    ])
    const enrollments = new FakeEnrollment({
      roster: Object.values(ids).map(enrollment),
    })
    const participants = new MakeupParticipantsService(
      new MakeupCandidatesService(enrollments, sessions, schedules),
      directory,
    )
    return {
      schedule,
      makeup,
      schedules,
      sessions,
      add: new AddMakeupParticipantsUseCase(schedules, participants),
      remove: new RemoveMakeupParticipantUseCase(schedules, sessions),
      get: new GetMakeupParticipantsUseCase(schedules, sessions, directory),
    }
  }

  describe('add', () => {
    it('adds an eligible student and refuses one already on it', async () => {
      const { makeup, schedules, add } = await setup()

      await add.execute(USER, makeup.id, [person(ids.citra)], NOW)

      expect(await schedules.listParticipants(makeup.id)).toHaveLength(3)
      await expect(
        add.execute(USER, makeup.id, [person(ids.citra)], NOW),
      ).rejects.toThrow(BadRequestException)
    })

    it('refuses a student who already sat the regular exam', async () => {
      const { schedule, makeup, sessions, add } = await setup()
      sessions.sessions.set(
        'a',
        sessionFor(schedule, {
          id: 'a',
          studentId: ids.dewi,
          status: 'SUBMITTED',
        }),
      )

      await expect(
        add.execute(USER, makeup.id, [person(ids.dewi)], NOW),
      ).rejects.toThrow('Dewi sudah mengikuti ujian ini')
    })

    it('only works on a schedule that is a live makeup', async () => {
      const { schedule, makeup, schedules, add } = await setup()

      await expect(
        add.execute(USER, 'missing', [person(ids.citra)], NOW),
      ).rejects.toThrow(NotFoundException)
      await expect(
        add.execute(USER, schedule.id, [person(ids.citra)], NOW),
      ).rejects.toThrow('Hanya jadwal susulan yang punya peserta')
      await expect(
        add.execute(
          USER,
          makeup.id,
          [person(ids.citra)],
          new Date('2026-11-06T00:00:00.000Z'),
        ),
      ).rejects.toThrow('Jendela ujian sudah lewat')
      await schedules.cancel(makeup.id)
      await expect(
        add.execute(USER, makeup.id, [person(ids.citra)], NOW),
      ).rejects.toThrow(ConflictException)
    })
  })

  describe('remove', () => {
    it('removes a student who has no session yet', async () => {
      const { makeup, schedules, remove } = await setup()

      await remove.execute(makeup.id, ids.budi)

      expect(
        (await schedules.listParticipants(makeup.id)).map((p) => p.studentId),
      ).toEqual([ids.ani])
    })

    it('refuses once the student has a session on the makeup', async () => {
      const { makeup, sessions, remove } = await setup()
      sessions.sessions.set(
        'm',
        sessionFor(makeup, { id: 'm', studentId: ids.budi }),
      )

      await expect(remove.execute(makeup.id, ids.budi)).rejects.toThrow(
        'Siswa sudah punya sesi, tidak bisa dihapus',
      )
    })

    it('refuses to empty the makeup and to remove someone who is not on it', async () => {
      const { makeup, remove } = await setup()
      await remove.execute(makeup.id, ids.budi)

      await expect(remove.execute(makeup.id, ids.ani)).rejects.toThrow(
        'Susulan harus punya minimal satu siswa',
      )
      await expect(remove.execute(makeup.id, ids.dewi)).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('get', () => {
    it('shows each student with a live status', async () => {
      const { schedule, makeup, sessions, schedules, get } = await setup()
      await schedules.addParticipants(
        makeup.id,
        [person(ids.citra), person(ids.dewi)],
        USER.id,
      )
      sessions.sessions.set(
        'r',
        sessionFor(schedule, {
          id: 'r',
          studentId: ids.ani,
          status: 'SUBMITTED',
        }),
      )
      sessions.sessions.set(
        'm1',
        sessionFor(makeup, { id: 'm1', studentId: ids.budi }),
      )
      sessions.sessions.set(
        'm2',
        sessionFor(makeup, {
          id: 'm2',
          studentId: ids.citra,
          status: 'GRADED',
        }),
      )

      const rows = await get.execute(makeup.id)

      expect(rows.map((row) => [row.name, row.status])).toEqual([
        ['Ani', 'SAT_REGULAR'],
        ['Budi', 'IN_PROGRESS'],
        ['Citra', 'DONE'],
        ['Dewi', 'WAITING'],
      ])
    })

    it('does not count an empty expired regular session as having sat the exam', async () => {
      const { schedule, makeup, sessions, get } = await setup()
      sessions.sessions.set(
        'r',
        sessionFor(schedule, {
          id: 'r',
          studentId: ids.ani,
          status: 'EXPIRED',
        }),
      )

      const rows = await get.execute(makeup.id)

      expect(rows.find((row) => row.name === 'Ani')?.status).toBe('WAITING')
    })
  })
})
