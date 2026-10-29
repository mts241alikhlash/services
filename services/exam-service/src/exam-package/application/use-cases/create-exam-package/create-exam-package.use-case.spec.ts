import { BadRequestException } from '@nestjs/common'
import { FakeQuestionRepository } from '../../../../question/application/question.repository.fake.js'
import { FakeExamPackageRepository } from '../../exam-package.repository.fake.js'
import {
  GRADE_ID,
  SUBJECT_ID,
  USER,
  seedApprovedQuestion,
} from '../../exam-package.test-support.js'
import { CreateExamPackageUseCase } from './create-exam-package.use-case.js'

describe('CreateExamPackageUseCase', () => {
  let packages: FakeExamPackageRepository
  let questions: FakeQuestionRepository
  let useCase: CreateExamPackageUseCase

  beforeEach(() => {
    packages = new FakeExamPackageRepository()
    questions = new FakeQuestionRepository()
    useCase = new CreateExamPackageUseCase(packages, questions)
  })

  const input = (questionIds: string[]) => ({
    title: 'UTS Matematika Kelas 7',
    subjectId: SUBJECT_ID,
    gradeId: GRADE_ID,
    questionIds,
  })

  it('pins the approved version of each question in the given order', async () => {
    const first = await seedApprovedQuestion(questions)
    const second = await seedApprovedQuestion(questions)

    const created = await useCase.execute(USER, input([second.id, first.id]))

    expect(created.status).toBe('DRAFT')
    expect(created.createdById).toBe(USER.id)
    expect(created.items).toEqual([
      { questionId: second.id, questionVersion: 1, position: 1 },
      { questionId: first.id, questionVersion: 1, position: 2 },
    ])
  })

  it('rejects a question that is not approved', async () => {
    const draft = await questions.create({
      subjectId: SUBJECT_ID,
      gradeId: GRADE_ID,
      authorEmployeeId: USER.id,
      type: 'TRUE_FALSE',
      createdById: USER.id,
      bodyHtml: '<p>x</p>',
      content: { answer: { value: true } },
      points: 1,
    })

    await expect(useCase.execute(USER, input([draft.id]))).rejects.toThrow(
      'Hanya soal yang sudah disetujui',
    )
    expect(packages.packages.size).toBe(0)
  })

  it('rejects a question of another grade', async () => {
    const other = await seedApprovedQuestion(questions, {
      gradeId: '44444444-4444-4444-8444-444444444444',
    })

    await expect(useCase.execute(USER, input([other.id]))).rejects.toThrow(
      'mapel dan tingkat yang sama',
    )
  })

  it('rejects a blank title', async () => {
    const question = await seedApprovedQuestion(questions)

    await expect(
      useCase.execute(USER, { ...input([question.id]), title: '   ' }),
    ).rejects.toThrow(BadRequestException)
  })

  it('keeps the pinned version when the question is edited afterwards', async () => {
    const question = await seedApprovedQuestion(questions)
    const created = await useCase.execute(USER, input([question.id]))

    await questions.addVersion(
      question.id,
      { bodyHtml: '<p>baru</p>', content: question.current.content, points: 3 },
      USER.id,
    )

    const stored = await packages.findById(created.id)
    expect(stored?.items[0].questionVersion).toBe(1)
  })
})
