import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common'
import { FakeExamPackageRepository } from '../../../../exam-package/application/exam-package.repository.fake.js'
import { FakeQuestionRepository } from '../../../../question/application/question.repository.fake.js'
import { FakeExamScheduleRepository } from '../../exam-schedule.repository.fake.js'
import {
  CLASSROOM_7A,
  END,
  FakeAcademicLookup,
  SEMESTER_ID,
  START,
  USER,
  draftPackage,
} from '../../exam-schedule.test-support.js'
import { CreateExamScheduleUseCase } from './create-exam-schedule.use-case.js'

describe('CreateExamScheduleUseCase', () => {
  let packages: FakeExamPackageRepository
  let schedules: FakeExamScheduleRepository
  let packageId: string

  const NOW = new Date('2026-10-30T00:00:00.000Z')

  const build = (academic = new FakeAcademicLookup()) => {
    const useCase = new CreateExamScheduleUseCase(schedules, packages, academic)
    return {
      execute: (
        user: { id: string },
        body: ReturnType<typeof input>,
        now: Date = NOW,
      ) => useCase.execute(user, body, now),
    }
  }

  const input = (overrides: Record<string, unknown> = {}) => ({
    packageId,
    classroomId: CLASSROOM_7A.id,
    startsAt: START,
    endsAt: END,
    durationMinutes: 90,
    ...overrides,
  })

  beforeEach(async () => {
    packages = new FakeExamPackageRepository()
    schedules = new FakeExamScheduleRepository(packages)
    packageId = (await draftPackage(packages, new FakeQuestionRepository())).id
  })

  it('creates the schedule and locks the package', async () => {
    const created = await build().execute(USER, input())

    expect(created.status).toBe('SCHEDULED')
    expect(created.semesterId).toBe(SEMESTER_ID)
    expect(created.createdById).toBe(USER.id)
    expect((await packages.findById(packageId))?.status).toBe('LOCKED')
  })

  it('refuses a classroom of another grade', async () => {
    const academic = new FakeAcademicLookup({
      classrooms: [
        { ...CLASSROOM_7A, gradeId: '44444444-4444-4444-8444-444444444444' },
      ],
    })

    await expect(build(academic).execute(USER, input())).rejects.toThrow(
      'Tingkat kelas tidak sama dengan tingkat paket',
    )
    expect(schedules.schedules.size).toBe(0)
  })

  it('refuses an unknown classroom', async () => {
    await expect(
      build().execute(
        USER,
        input({ classroomId: '00000000-0000-4000-8000-000000000000' }),
      ),
    ).rejects.toThrow(NotFoundException)
  })

  it('refuses an unknown package', async () => {
    await expect(
      build().execute(
        USER,
        input({ packageId: '00000000-0000-4000-8000-000000000000' }),
      ),
    ).rejects.toThrow('Paket tidak ditemukan')
  })

  it('refuses an inverted window', async () => {
    await expect(
      build().execute(USER, input({ startsAt: END, endsAt: START })),
    ).rejects.toThrow(BadRequestException)
    expect((await packages.findById(packageId))?.status).toBe('DRAFT')
  })

  it('fails with 409 when there is no active semester', async () => {
    await expect(
      build(new FakeAcademicLookup({ semesterId: null })).execute(
        USER,
        input(),
      ),
    ).rejects.toThrow(ConflictException)
  })

  it('propagates a 503 from the academic service', async () => {
    const academic = new FakeAcademicLookup({
      failWith: new ServiceUnavailableException('academic down'),
    })

    await expect(build(academic).execute(USER, input())).rejects.toThrow(
      ServiceUnavailableException,
    )
    expect(schedules.schedules.size).toBe(0)
  })

  it('refuses a package deleted while the schedule is being created', async () => {
    class DeletesPackageMidway extends FakeAcademicLookup {
      override async activeSemester() {
        await packages.softDeleteDraft(packageId)
        return super.activeSemester()
      }
    }

    await expect(
      build(new DeletesPackageMidway()).execute(USER, input()),
    ).rejects.toThrow('Paket tidak ditemukan')
    expect(schedules.schedules.size).toBe(0)
  })

  it('refuses a window that has already ended', async () => {
    await expect(
      build().execute(USER, input(), new Date('2026-11-03T00:00:00.000Z')),
    ).rejects.toThrow('Jendela ujian sudah lewat')
    expect((await packages.findById(packageId))?.status).toBe('DRAFT')
  })

  it('refuses a classroom of another academic year', async () => {
    const academic = new FakeAcademicLookup({
      classrooms: [
        {
          ...CLASSROOM_7A,
          academicYearId: '34343434-3434-4343-8343-343434343434',
        },
      ],
    })

    await expect(build(academic).execute(USER, input())).rejects.toThrow(
      'Kelas bukan kelas tahun ajaran aktif',
    )
    expect(schedules.schedules.size).toBe(0)
  })
})
