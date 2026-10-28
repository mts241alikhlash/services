import { NotFoundException } from '@nestjs/common'
import { Readable } from 'node:stream'
import type { GetExamFileUseCase } from '../../../../exam-file/application/use-cases/get-exam-file/get-exam-file.use-case.js'
import { FakeExamPackageRepository } from '../../../../exam-package/application/exam-package.repository.fake.js'
import { FakeExamScheduleRepository } from '../../../../exam-schedule/application/exam-schedule.repository.fake.js'
import { FakeQuestionRepository } from '../../../../question/application/question.repository.fake.js'
import { FakeExamSessionRepository } from '../../exam-session.repository.fake.js'
import {
  CHOICES,
  NOW,
  STUDENT_USER,
  schedulePaper,
  sessionFor,
} from '../../exam-session.test-support.js'
import { FakeSessionFinalizer } from '../../session-finalizer.fake.js'
import { SessionAccessService } from '../../session-access.service.js'
import { GetSessionFileUseCase } from './get-session-file.use-case.js'

const USED = '8a1f3c52-1b2d-4e6f-9a7b-0c1d2e3f4a5b'
const IN_CHOICE = '9b2e4d63-2c3e-4f70-8b8c-1d2e3f4a5b6c'
const IN_GUIDE = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const OTHER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'

describe('GetSessionFileUseCase', () => {
  const fileResult = { file: { id: USED }, stream: Readable.from([]) }
  const execute = jest.fn(() => Promise.resolve(fileResult))
  const getFile = { execute } as unknown as GetExamFileUseCase

  async function setup(guideImage = false) {
    const packages = new FakeExamPackageRepository()
    const schedules = new FakeExamScheduleRepository(packages)
    const questions = new FakeQuestionRepository()
    const sessions = new FakeExamSessionRepository()
    const { schedule } = await schedulePaper(
      { packages, schedules, questions },
      [
        {
          type: 'MULTIPLE_CHOICE',
          content: {
            choices: CHOICES.map((choice, index) =>
              index === 0
                ? { ...choice, html: `<img data-file-id="${IN_CHOICE}">` }
                : choice,
            ),
            answer: { key: 'B' },
          },
          bodyHtml: `<p>Lihat gambar</p><img data-file-id="${USED}" alt="peta">`,
        },
      ],
    )
    if (guideImage) {
      const extra = await schedulePaper({ packages, schedules, questions }, [
        {
          type: 'ESSAY',
          content: { guideHtml: `<img data-file-id="${IN_GUIDE}">` },
        },
      ])
      sessions.sessions.set('g', sessionFor(extra.schedule, { id: 'g' }))
    }
    sessions.sessions.set('a', sessionFor(schedule, { id: 'a' }))
    return new GetSessionFileUseCase(
      new SessionAccessService(sessions, new FakeSessionFinalizer()),
      schedules,
      packages,
      questions,
      getFile,
    )
  }

  beforeEach(() => execute.mockClear())

  it('serves an image used in the body of a question of the paper', async () => {
    const useCase = await setup()

    await useCase.execute(STUDENT_USER, 'a', USED, NOW)

    expect(execute).toHaveBeenCalledWith(USED)
  })

  it('serves an image used in a choice', async () => {
    const useCase = await setup()

    await useCase.execute(STUDENT_USER, 'a', IN_CHOICE, NOW)

    expect(execute).toHaveBeenCalledWith(IN_CHOICE)
  })

  it('answers 404 for an image the paper does not use', async () => {
    const useCase = await setup()

    await expect(
      useCase.execute(STUDENT_USER, 'a', OTHER, NOW),
    ).rejects.toThrow(NotFoundException)
    expect(execute).not.toHaveBeenCalled()
  })

  it("answers 404 for someone else's session", async () => {
    const useCase = await setup()

    await expect(
      useCase.execute({ id: 'intruder', deviceId: 'device-1' }, 'a', USED, NOW),
    ).rejects.toThrow(NotFoundException)
  })

  it('does not serve an image that only the marking guide uses', async () => {
    const useCase = await setup(true)

    await expect(
      useCase.execute(STUDENT_USER, 'g', IN_GUIDE, NOW),
    ).rejects.toThrow(NotFoundException)
  })
})
