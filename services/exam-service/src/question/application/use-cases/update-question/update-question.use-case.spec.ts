import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common'
import {
  FakeQuestionRepository,
  MANAGER,
  MATH_7,
  TEACHER,
  buildTeacherScope,
} from '../../question.repository.fake.js'
import { UpdateQuestionUseCase } from './update-question.use-case.js'

const created = {
  ...MATH_7,
  authorEmployeeId: 'emp-1',
  type: 'TRUE_FALSE' as const,
  createdById: TEACHER.id,
  bodyHtml: '<p>Bumi bulat</p>',
  content: { answer: { value: true } },
  points: 1,
}

async function build(employeeId = 'emp-1') {
  const repository = new FakeQuestionRepository()
  const { scope } = buildTeacherScope({ employeeId, pairs: [MATH_7] })
  const question = await repository.create(created)
  return {
    repository,
    question,
    useCase: new UpdateQuestionUseCase(repository, scope),
  }
}

describe('UpdateQuestionUseCase', () => {
  it('edits a draft in place at version 1', async () => {
    const { repository, question, useCase } = await build()

    const updated = await useCase.execute(TEACHER, question.id, {
      bodyHtml: '<p onclick="x()">Bumi datar</p>',
      content: { answer: { value: false } },
      points: 3,
    })

    expect(updated).toMatchObject({
      status: 'DRAFT',
      currentVersion: 1,
      current: {
        number: 1,
        bodyHtml: '<p>Bumi datar</p>',
        content: { answer: { value: false } },
        points: 3,
      },
    })
    expect(await repository.findVersions(question.id)).toHaveLength(1)
  })

  it('writes version 2 of an approved question and keeps the approved one', async () => {
    const { repository, question, useCase } = await build()
    repository.approve(question.id)

    const updated = await useCase.execute(TEACHER, question.id, {
      points: 5,
    })

    expect(updated).toMatchObject({
      status: 'DRAFT',
      currentVersion: 2,
      approvedVersion: 1,
      current: { number: 2, points: 5, bodyHtml: '<p>Bumi bulat</p>' },
      approved: { number: 1, points: 1 },
    })
    expect(await repository.findVersions(question.id)).toHaveLength(2)
  })

  it('returns a submitted question to draft', async () => {
    const { repository, question, useCase } = await build()
    repository.questions.set(question.id, { ...question, status: 'SUBMITTED' })

    const updated = await useCase.execute(TEACHER, question.id, { points: 2 })

    expect(updated.status).toBe('DRAFT')
    expect(updated.currentVersion).toBe(1)
  })

  it('keeps a returned question returned while it is edited', async () => {
    const { repository, question, useCase } = await build()
    repository.questions.set(question.id, { ...question, status: 'RETURNED' })

    const updated = await useCase.execute(TEACHER, question.id, { points: 2 })

    expect(updated.status).toBe('RETURNED')
  })

  it('refuses a colleague, but lets a manager change it', async () => {
    const { question, useCase } = await build('emp-2')

    await expect(
      useCase.execute(TEACHER, question.id, { points: 2 }),
    ).rejects.toThrow(ForbiddenException)

    const { scope } = buildTeacherScope({ employeeId: null })
    const repository = new FakeQuestionRepository()
    const own = await repository.create(created)
    const manager = new UpdateQuestionUseCase(repository, scope)
    await expect(
      manager.execute(MANAGER, own.id, { points: 2 }),
    ).resolves.toMatchObject({ current: { points: 2 } })
  })

  it('refuses content that does not fit the question type', async () => {
    const { question, useCase } = await build()

    await expect(
      useCase.execute(TEACHER, question.id, { content: { guideHtml: null } }),
    ).rejects.toThrow(BadRequestException)
  })

  it('refuses an update that changes nothing', async () => {
    const { question, useCase } = await build()

    await expect(useCase.execute(TEACHER, question.id, {})).rejects.toThrow(
      new BadRequestException('Tidak ada yang diubah'),
    )
  })

  it('answers 404 for an unknown question', async () => {
    const { useCase } = await build()

    await expect(
      useCase.execute(TEACHER, 'missing', { points: 2 }),
    ).rejects.toThrow(NotFoundException)
  })

  it('never edits an approved version in place when it was approved after the read', async () => {
    const { repository, question, useCase } = await build()
    const stale = await repository.findById(question.id)
    repository.approve(question.id)
    jest.spyOn(repository, 'findById').mockResolvedValueOnce(stale)

    await expect(
      useCase.execute(TEACHER, question.id, { points: 9 }),
    ).rejects.toThrow(
      new ConflictException('Status soal sudah berubah, muat ulang'),
    )

    const stored = await repository.findById(question.id)
    expect(stored?.approved?.points).toBe(1)
    expect(stored?.current.points).toBe(1)
  })

  it('never writes a second version over a question that left approved after the read', async () => {
    const { repository, question, useCase } = await build()
    repository.approve(question.id)
    const stale = await repository.findById(question.id)
    repository.questions.set(question.id, { ...stale!, status: 'DRAFT' })
    jest.spyOn(repository, 'findById').mockResolvedValueOnce(stale)

    await expect(
      useCase.execute(TEACHER, question.id, { points: 9 }),
    ).rejects.toThrow(ConflictException)
    expect(await repository.findVersions(question.id)).toHaveLength(1)
  })

  it('refuses points outside the allowed range', async () => {
    const { question, useCase } = await build()

    await expect(
      useCase.execute(TEACHER, question.id, { points: 1000 }),
    ).rejects.toThrow(new BadRequestException('Poin harus antara 0,25 dan 100'))
  })
})
