import { ConflictException, NotFoundException } from '@nestjs/common'
import { FakeExamPackageRepository } from '../../../../exam-package/application/exam-package.repository.fake.js'
import { FakeQuestionRepository } from '../../../../question/application/question.repository.fake.js'
import { AccessCodeService } from '../../access-code.service.js'
import { CancelExamScheduleUseCase } from '../cancel-exam-schedule/cancel-exam-schedule.use-case.js'
import { CreateExamScheduleUseCase } from '../create-exam-schedule/create-exam-schedule.use-case.js'
import { FakeScheduleSessionGuard } from '../../schedule-session-guard.fake.js'
import { FakeExamScheduleRepository } from '../../exam-schedule.repository.fake.js'
import {
  CLASSROOM_7A,
  END,
  FakeAcademicLookup,
  START,
  USER,
  draftPackage,
} from '../../exam-schedule.test-support.js'
import { RotateAccessCodeUseCase } from '../rotate-access-code/rotate-access-code.use-case.js'
import { GetAccessCodeUseCase } from './get-access-code.use-case.js'

const codes = new AccessCodeService(
  'unit-test-secret-of-at-least-32-characters',
)

describe('Access code use cases', () => {
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

  it('derives the access code from the schedule and its rotation', async () => {
    const result = await new GetAccessCodeUseCase(schedules, codes).execute(
      scheduleId,
    )

    expect(result).toEqual({
      accessCode: codes.codeFor(scheduleId, 0),
      rotation: 0,
    })
  })

  it('rotate raises the rotation and changes the code', async () => {
    const before = await new GetAccessCodeUseCase(schedules, codes).execute(
      scheduleId,
    )

    const after = await new RotateAccessCodeUseCase(schedules, codes).execute(
      scheduleId,
    )

    expect(after.rotation).toBe(1)
    expect(after.accessCode).not.toBe(before.accessCode)
    expect(
      (await new GetAccessCodeUseCase(schedules, codes).execute(scheduleId))
        .accessCode,
    ).toBe(after.accessCode)
  })

  it('answers 404 for an unknown schedule', async () => {
    await expect(
      new GetAccessCodeUseCase(schedules, codes).execute(
        '00000000-0000-4000-8000-000000000000',
      ),
    ).rejects.toThrow(NotFoundException)
  })

  it('refuses the code of a cancelled schedule', async () => {
    await new CancelExamScheduleUseCase(
      schedules,
      new FakeScheduleSessionGuard(),
    ).execute(scheduleId)

    await expect(
      new GetAccessCodeUseCase(schedules, codes).execute(scheduleId),
    ).rejects.toThrow(ConflictException)
    await expect(
      new RotateAccessCodeUseCase(schedules, codes).execute(scheduleId),
    ).rejects.toThrow(ConflictException)
  })
})
