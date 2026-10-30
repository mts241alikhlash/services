import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'
import { FakeExamPackageRepository } from '../../../../exam-package/application/exam-package.repository.fake.js'
import {
  seedPackage,
  USER,
} from '../../../../exam-package/application/exam-package.test-support.js'
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
import { CreateMakeupUseCase } from './create-makeup.use-case.js'

const ids = {
  ani: '31000000-0000-4000-8000-000000000001',
  budi: '31000000-0000-4000-8000-000000000002',
  citra: '31000000-0000-4000-8000-000000000003',
}

const enrollment = (studentId: string) => ({
  id: `enr-${studentId}`,
  studentId,
  classroomId: CLASSROOM_7A.id,
  semesterId: SEMESTER_ID,
})

const WINDOW = {
  startsAt: new Date('2026-11-05T01:00:00.000Z'),
  endsAt: new Date('2026-11-05T04:00:00.000Z'),
  durationMinutes: 90,
}

describe('CreateMakeupUseCase', () => {
  async function setup() {
    const packages = new FakeExamPackageRepository()
    const schedules = new FakeExamScheduleRepository(packages)
    const questions = new FakeQuestionRepository()
    const sessions = new FakeExamSessionRepository()
    const { schedule } = await schedulePaper(
      { packages, schedules, questions },
      [choiceSpec('B')],
    )
    const directory = new FakeStudentDirectory([
      { id: ids.ani, nis: '1', name: 'Ani' },
      { id: ids.budi, nis: '2', name: 'Budi' },
      { id: ids.citra, nis: '3', name: 'Citra' },
    ])
    const useCase = new CreateMakeupUseCase(
      schedules,
      packages,
      new MakeupCandidatesService(
        new FakeEnrollment({ roster: Object.values(ids).map(enrollment) }),
        sessions,
        schedules,
      ),
      directory,
    )
    return { schedule, schedules, packages, questions, sessions, useCase }
  }

  const people = (...studentIds: string[]) =>
    studentIds.map((studentId) => ({
      studentId,
      reason: 'SICK' as const,
      note: null,
    }))

  it('creates a makeup that copies the classroom, semester and type of the original', async () => {
    const { schedule, schedules, useCase } = await setup()

    const makeup = await useCase.execute(
      USER,
      schedule.id,
      { ...WINDOW, participants: people(ids.ani, ids.budi) },
      NOW,
    )

    expect(makeup).toMatchObject({
      kind: 'MAKEUP',
      makeupOfId: schedule.id,
      classroomId: schedule.classroomId,
      semesterId: schedule.semesterId,
      type: schedule.type,
      packageId: schedule.packageId,
    })
    expect(await schedules.listParticipants(makeup.id)).toHaveLength(2)
  })

  it('refuses a missing, makeup or cancelled original', async () => {
    const { schedule, schedules, useCase } = await setup()
    const input = { ...WINDOW, participants: people(ids.ani) }

    await expect(useCase.execute(USER, 'missing', input, NOW)).rejects.toThrow(
      NotFoundException,
    )
    const makeup = await useCase.execute(USER, schedule.id, input, NOW)
    await expect(useCase.execute(USER, makeup.id, input, NOW)).rejects.toThrow(
      BadRequestException,
    )
    await schedules.cancel(schedule.id)
    await expect(
      useCase.execute(USER, schedule.id, input, NOW),
    ).rejects.toThrow(ConflictException)
  })

  it('refuses a window that opens before the original ends', async () => {
    const { schedule, useCase } = await setup()

    await expect(
      useCase.execute(
        USER,
        schedule.id,
        {
          startsAt: new Date(schedule.endsAt.getTime() - 60_000),
          endsAt: new Date(schedule.endsAt.getTime() + 3_600_000),
          durationMinutes: 30,
          participants: people(ids.ani),
        },
        NOW,
      ),
    ).rejects.toThrow('Susulan harus dimulai setelah ujian utama berakhir')
  })

  it('refuses a bad window, a window in the past and a duration longer than the window', async () => {
    const { schedule, useCase } = await setup()
    const participants = people(ids.ani)

    await expect(
      useCase.execute(
        USER,
        schedule.id,
        { ...WINDOW, durationMinutes: 600, participants },
        NOW,
      ),
    ).rejects.toThrow(BadRequestException)
    await expect(
      useCase.execute(
        USER,
        schedule.id,
        { ...WINDOW, participants },
        new Date('2026-11-06T00:00:00.000Z'),
      ),
    ).rejects.toThrow('Jendela ujian sudah lewat')
  })

  it('needs at least one student, once each, from the classroom', async () => {
    const { schedule, useCase } = await setup()
    const base = { ...WINDOW }

    await expect(
      useCase.execute(USER, schedule.id, { ...base, participants: [] }, NOW),
    ).rejects.toThrow('Pilih minimal satu siswa')
    await expect(
      useCase.execute(
        USER,
        schedule.id,
        { ...base, participants: people(ids.ani, ids.ani) },
        NOW,
      ),
    ).rejects.toThrow('Siswa terdaftar dua kali')
    await expect(
      useCase.execute(
        USER,
        schedule.id,
        {
          ...base,
          participants: people('99999999-0000-4000-8000-000000000009'),
        },
        NOW,
      ),
    ).rejects.toThrow('Siswa bukan bagian dari kelas ini')
  })

  it('names the student and the reason when someone cannot sit a makeup', async () => {
    const { schedule, sessions, useCase } = await setup()
    sessions.sessions.set(
      'a',
      sessionFor(schedule, {
        id: 'a',
        studentId: ids.budi,
        status: 'SUBMITTED',
      }),
    )

    await expect(
      useCase.execute(
        USER,
        schedule.id,
        { ...WINDOW, participants: people(ids.ani, ids.budi) },
        NOW,
      ),
    ).rejects.toThrow('Budi sudah mengikuti ujian ini')
  })

  it('refuses a second live makeup for a student who is already on one', async () => {
    const { schedule, useCase } = await setup()
    await useCase.execute(
      USER,
      schedule.id,
      { ...WINDOW, participants: people(ids.ani) },
      NOW,
    )

    await expect(
      useCase.execute(
        USER,
        schedule.id,
        { ...WINDOW, participants: people(ids.ani) },
        NOW,
      ),
    ).rejects.toThrow('Ani sudah terdaftar di susulan lain')
  })

  it('can use another approved package of the same subject and grade, and refuses a draft or other subject', async () => {
    const { schedule, packages, questions, useCase } = await setup()
    const other = await seedPackage(packages, questions, [{}], 'APPROVED', {
      title: 'UTS susulan',
    })
    const draft = await seedPackage(packages, questions, [{}], 'DRAFT', {
      title: 'Draf',
    })
    const foreign = await seedPackage(packages, questions, [{}], 'APPROVED', {
      title: 'Lain',
      subjectId: '55555555-0000-4000-8000-000000000001',
    })
    const input = { ...WINDOW, participants: people(ids.ani) }

    const makeup = await useCase.execute(
      USER,
      schedule.id,
      { ...input, packageId: other.id },
      NOW,
    )
    expect(makeup.packageId).toBe(other.id)
    await expect(
      useCase.execute(
        USER,
        schedule.id,
        { ...input, packageId: draft.id },
        NOW,
      ),
    ).rejects.toThrow(ConflictException)
    await expect(
      useCase.execute(
        USER,
        schedule.id,
        { ...input, packageId: foreign.id },
        NOW,
      ),
    ).rejects.toThrow('Paket susulan harus untuk mapel dan tingkat yang sama')
  })
})
