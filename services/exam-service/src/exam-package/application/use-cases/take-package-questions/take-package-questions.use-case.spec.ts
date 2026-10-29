import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common'
import {
  MATH_7,
  TEACHER,
} from '../../../../question/application/question.repository.fake.js'
import type {
  ExamPackageStatus,
  PackageItem,
} from '../../../domain/entities/exam-package.entity.js'
import { packageWorld } from '../../package-question.test-support.js'
import { TakePackageQuestionsUseCase } from './take-package-questions.use-case.js'

async function setup(pairs?: { subjectId: string; gradeId: string }[]) {
  const world = await packageWorld({ pairs })
  const useCase = new TakePackageQuestionsUseCase(
    world.packages,
    world.questions,
    world.scope,
    world.employees,
  )

  async function source(
    status: ExamPackageStatus = 'APPROVED',
    scope: { subjectId: string; gradeId: string } = MATH_7,
  ) {
    const row = await world.packages.create({
      title: 'Soal lama',
      ...scope,
      createdById: 'user-9',
      items: [],
    })
    const items: PackageItem[] = []
    for (const [index, bodyHtml] of ['<p>Satu</p>', '<p>Dua</p>'].entries()) {
      const question = await world.questions.create({
        packageId: row.id,
        ...scope,
        authorEmployeeId: 'emp-9',
        type: 'TRUE_FALSE',
        createdById: 'user-9',
        bodyHtml,
        content: { answer: { value: true } },
        points: 2,
      })
      items.push({
        questionId: question.id,
        questionVersion: 1,
        position: index + 1,
      })
    }
    world.packages.packages.set(row.id, { ...row, status, items })
    return { id: row.id, ids: items.map((item) => item.questionId) }
  }

  return { ...world, useCase, source }
}

describe('TakePackageQuestionsUseCase', () => {
  it('copies the questions to the end of the target with their lineage', async () => {
    const { useCase, pkg, source, questions } = await setup()

    const from = await source()
    const result = await useCase.execute(TEACHER, pkg.id, from.id, from.ids)

    expect(result.items.map((item) => item.position)).toEqual([1, 2])
    const copies = result.items.map((item) =>
      questions.questions.get(item.questionId),
    )
    expect(copies.map((copy) => copy?.copiedFromQuestionId)).toEqual(from.ids)
    expect(copies.map((copy) => copy?.copiedFromVersion)).toEqual([1, 1])
    expect(copies.map((copy) => copy?.packageId)).toEqual([pkg.id, pkg.id])
  })

  it('the copy has its own id and the same content', async () => {
    const { useCase, pkg, source, questions } = await setup()
    const from = await source()

    const result = await useCase.execute(TEACHER, pkg.id, from.id, [
      from.ids[1],
    ])

    const copy = questions.questions.get(result.items[0].questionId)
    expect(copy?.id).not.toBe(from.ids[1])
    expect(copy?.current.bodyHtml).toBe('<p>Dua</p>')
    expect(copy?.current.points).toBe(2)
  })

  it('refuses a source that is a draft, submitted or returned', async () => {
    const { useCase, pkg, source } = await setup()

    for (const status of ['DRAFT', 'SUBMITTED', 'RETURNED'] as const) {
      const from = await source(status)
      await expect(
        useCase.execute(TEACHER, pkg.id, from.id, from.ids),
      ).rejects.toThrow(ConflictException)
    }
  })

  it('takes from a locked package', async () => {
    const { useCase, pkg, source } = await setup()
    const from = await source('LOCKED')

    const result = await useCase.execute(TEACHER, pkg.id, from.id, from.ids)

    expect(result.items).toHaveLength(2)
  })

  it('refuses a source of another subject or grade', async () => {
    const { useCase, pkg, source } = await setup([
      MATH_7,
      { subjectId: 'ipa', gradeId: 'grade-7' },
    ])
    const from = await source('APPROVED', {
      subjectId: 'ipa',
      gradeId: 'grade-7',
    })

    await expect(
      useCase.execute(TEACHER, pkg.id, from.id, from.ids),
    ).rejects.toThrow(BadRequestException)
  })

  it('refuses a question that is not in the source', async () => {
    const { useCase, pkg, source } = await setup()
    const from = await source()

    await expect(
      useCase.execute(TEACHER, pkg.id, from.id, [
        '00000000-0000-4000-8000-000000000000',
      ]),
    ).rejects.toThrow(NotFoundException)
  })

  it('refuses an empty or repeated list', async () => {
    const { useCase, pkg, source } = await setup()
    const from = await source()

    await expect(useCase.execute(TEACHER, pkg.id, from.id, [])).rejects.toThrow(
      BadRequestException,
    )
    await expect(
      useCase.execute(TEACHER, pkg.id, from.id, [from.ids[0], from.ids[0]]),
    ).rejects.toThrow(BadRequestException)
  })

  it('refuses a teacher outside the subject and grade', async () => {
    const { useCase, pkg, source } = await setup([])
    const from = await source()

    await expect(
      useCase.execute(TEACHER, pkg.id, from.id, from.ids),
    ).rejects.toThrow(ForbiddenException)
  })

  it('taking into an approved target sets it back to draft', async () => {
    const { useCase, pkg, source, setStatus } = await setup()
    setStatus('APPROVED')
    const from = await source()

    const result = await useCase.execute(TEACHER, pkg.id, from.id, from.ids)

    expect(result.status).toBe('DRAFT')
  })
})
