import { ServiceUnavailableException } from '@nestjs/common'
import { FakeExamPackageRepository } from '../../../../exam-package/application/exam-package.repository.fake.js'
import { FakeQuestionRepository } from '../../../../question/application/question.repository.fake.js'
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
import { GetExamScheduleUseCase } from '../get-exam-schedule/get-exam-schedule.use-case.js'
import { ListExamSchedulesUseCase } from './list-exam-schedules.use-case.js'

describe('List and get exam schedules', () => {
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

  it('labels each row with its classroom name', async () => {
    const page = await new ListExamSchedulesUseCase(
      schedules,
      new FakeAcademicLookup(),
    ).execute({})

    expect(page.total).toBe(1)
    expect(page.data[0].classroomName).toBe('VII A')
  })

  it('keeps a row whose classroom is gone and leaves the label empty', async () => {
    const page = await new ListExamSchedulesUseCase(
      schedules,
      new FakeAcademicLookup({ classrooms: [] }),
    ).execute({})

    expect(page.data[0].classroomName).toBeNull()
  })

  it('fails closed when the academic service is down', async () => {
    await expect(
      new ListExamSchedulesUseCase(
        schedules,
        new FakeAcademicLookup({
          failWith: new ServiceUnavailableException('down'),
        }),
      ).execute({}),
    ).rejects.toThrow(ServiceUnavailableException)
  })

  it('gets one schedule with its classroom name', async () => {
    const view = await new GetExamScheduleUseCase(
      schedules,
      new FakeAcademicLookup(),
    ).execute(scheduleId)

    expect(view.id).toBe(scheduleId)
    expect(view.classroomName).toBe('VII A')
  })
})
