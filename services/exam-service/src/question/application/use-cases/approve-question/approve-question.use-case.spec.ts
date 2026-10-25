import { ConflictException, NotFoundException } from '@nestjs/common'
import {
  FakeQuestionRepository,
  MANAGER,
  MATH_7,
} from '../../question.repository.fake.js'
import { ApproveQuestionUseCase } from './approve-question.use-case.js'

const created = {
  ...MATH_7,
  authorEmployeeId: 'emp-1',
  type: 'TRUE_FALSE' as const,
  createdById: 'user-1',
  bodyHtml: '<p>Bumi bulat</p>',
  content: { answer: { value: true } },
  points: 1,
}

async function submitted() {
  const repository = new FakeQuestionRepository()
  const question = await repository.create(created)
  repository.questions.set(question.id, { ...question, status: 'SUBMITTED' })
  return {
    repository,
    question,
    useCase: new ApproveQuestionUseCase(repository),
  }
}

describe('ApproveQuestionUseCase', () => {
  it('approves the current version and records the review', async () => {
    const { question, useCase } = await submitted()

    const approved = await useCase.execute(
      MANAGER,
      question.id,
      question.revision,
    )

    expect(approved).toMatchObject({
      status: 'APPROVED',
      approvedVersion: 1,
      approved: { number: 1 },
    })
    expect(approved.reviews).toMatchObject([
      { action: 'APPROVED', versionNumber: 1, byUserId: MANAGER.id },
    ])
  })

  it('moves the approved version forward when a newer version is approved', async () => {
    const { repository, question, useCase } = await submitted()
    await useCase.execute(MANAGER, question.id, question.revision)
    await repository.addVersion(
      question.id,
      { bodyHtml: '<p>Baru</p>', content: created.content, points: 2 },
      'user-1',
    )
    const draft = await repository.findById(question.id)
    repository.questions.set(question.id, { ...draft!, status: 'SUBMITTED' })

    const approved = await useCase.execute(
      MANAGER,
      question.id,
      draft!.revision,
    )

    expect(approved).toMatchObject({
      approvedVersion: 2,
      approved: { number: 2, bodyHtml: '<p>Baru</p>' },
    })
    expect(await repository.findVersions(question.id)).toHaveLength(2)
  })

  it.each(['DRAFT', 'APPROVED', 'RETURNED'] as const)(
    'refuses a %s question with 409',
    async (status) => {
      const { repository, question, useCase } = await submitted()
      repository.questions.set(question.id, { ...question, status })

      await expect(
        useCase.execute(MANAGER, question.id, question.revision),
      ).rejects.toThrow(ConflictException)
    },
  )

  it('answers 409 when the status changed under it, and 404 for unknown', async () => {
    const { repository, question, useCase } = await submitted()
    jest.spyOn(repository, 'applyReview').mockResolvedValueOnce(null)

    await expect(
      useCase.execute(MANAGER, question.id, question.revision),
    ).rejects.toThrow(
      new ConflictException('Status soal sudah berubah, muat ulang'),
    )
    await expect(useCase.execute(MANAGER, 'missing', 1)).rejects.toThrow(
      NotFoundException,
    )
  })

  it('never approves a version the reviewer did not read', async () => {
    const { repository, question, useCase } = await submitted()
    const stale = await repository.findById(question.id)
    repository.approve(question.id)
    await repository.addVersion(
      question.id,
      { bodyHtml: '<p>Belum dibaca</p>', content: created.content, points: 9 },
      'user-1',
      { status: 'APPROVED', currentVersion: 1 },
    )
    const edited = await repository.findById(question.id)
    repository.questions.set(question.id, { ...edited!, status: 'SUBMITTED' })
    jest.spyOn(repository, 'findById').mockResolvedValueOnce(stale)

    await expect(
      useCase.execute(MANAGER, question.id, question.revision),
    ).rejects.toThrow(
      new ConflictException('Status soal sudah berubah, muat ulang'),
    )
    const stored = await repository.findById(question.id)
    expect(stored?.status).toBe('SUBMITTED')
    expect(stored?.approvedVersion).toBe(1)
    expect(stored?.reviews.filter((r) => r.versionNumber === 2)).toEqual([])
  })

  it('never approves text that was edited and resubmitted after the reviewer read it', async () => {
    const { repository, question, useCase } = await submitted()
    const readByReviewer = question.revision
    await repository.editCurrentVersion(
      question.id,
      { bodyHtml: '<p>Diganti</p>', content: created.content, points: 9 },
      'DRAFT',
      { status: 'SUBMITTED', currentVersion: 1 },
    )
    const edited = await repository.findById(question.id)
    repository.questions.set(question.id, { ...edited!, status: 'SUBMITTED' })

    await expect(
      useCase.execute(MANAGER, question.id, readByReviewer),
    ).rejects.toThrow(
      new ConflictException('Status soal sudah berubah, muat ulang'),
    )
    expect((await repository.findById(question.id))?.status).toBe('SUBMITTED')
    expect((await repository.findById(question.id))?.approvedVersion).toBeNull()
  })
})
