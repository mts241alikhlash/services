import { ConflictException, NotFoundException } from '@nestjs/common'
import { FakeExamPackageRepository } from '../../../../exam-package/application/exam-package.repository.fake.js'
import { FakeQuestionRepository } from '../../../../question/application/question.repository.fake.js'
import { CancelExamScheduleUseCase } from '../cancel-exam-schedule/cancel-exam-schedule.use-case.js'
import { CreateExamScheduleUseCase } from '../create-exam-schedule/create-exam-schedule.use-case.js'
import { FakeExamScheduleRepository } from '../../exam-schedule.repository.fake.js'
import {
  CLASSROOM_7A,
  END,
  FakeAcademicLookup,
  START,
  USER,
  draftPackage,
} from '../../exam-schedule.test-support.js'
import { UpdateExamScheduleUseCase } from './update-exam-schedule.use-case.js'

describe('Update and cancel exam schedule', () => {
  let schedules: FakeExamScheduleRepository
  let scheduleId: string

  beforeEach(async () => {
    const packages = new FakeExamPackageRepository()
    schedules = new FakeExamScheduleRepository(packages)
    const pkg = await draftPackage(packages, new FakeQuestionRepository())
    scheduleId = (
      await new CreateExamScheduleUseCase(
        schedules,
        packages,
        new FakeAcademicLookup(),
      ).execute(USER, {
        packageId: pkg.id,
        classroomId: CLASSROOM_7A.id,
        startsAt: START,
        endsAt: END,
        durationMinutes: 90,
      })
    ).id
  })

  const later = new Date('2026-11-02T06:00:00.000Z')

  it('changes the window and the duration', async () => {
    const updated = await new UpdateExamScheduleUseCase(schedules).execute(
      scheduleId,
      { startsAt: START, endsAt: later, durationMinutes: 120 },
    )

    expect(updated.endsAt).toEqual(later)
    expect(updated.durationMinutes).toBe(120)
  })

  it('refuses an invalid window without changing the schedule', async () => {
    await expect(
      new UpdateExamScheduleUseCase(schedules).execute(scheduleId, {
        startsAt: START,
        endsAt: END,
        durationMinutes: 500,
      }),
    ).rejects.toThrow('Durasi tidak boleh lebih panjang')
    expect((await schedules.findById(scheduleId))?.durationMinutes).toBe(90)
  })

  it('answers 404 for an unknown schedule', async () => {
    await expect(
      new UpdateExamScheduleUseCase(schedules).execute(
        '00000000-0000-4000-8000-000000000000',
        { startsAt: START, endsAt: END, durationMinutes: 60 },
      ),
    ).rejects.toThrow(NotFoundException)
  })

  it('cancel marks the schedule cancelled', async () => {
    await new CancelExamScheduleUseCase(schedules).execute(scheduleId)

    expect((await schedules.findById(scheduleId))?.status).toBe('CANCELLED')
  })

  it('refuses to update or cancel a cancelled schedule', async () => {
    await new CancelExamScheduleUseCase(schedules).execute(scheduleId)

    await expect(
      new UpdateExamScheduleUseCase(schedules).execute(scheduleId, {
        startsAt: START,
        endsAt: END,
        durationMinutes: 60,
      }),
    ).rejects.toThrow(ConflictException)
    await expect(
      new CancelExamScheduleUseCase(schedules).execute(scheduleId),
    ).rejects.toThrow(ConflictException)
  })
})
