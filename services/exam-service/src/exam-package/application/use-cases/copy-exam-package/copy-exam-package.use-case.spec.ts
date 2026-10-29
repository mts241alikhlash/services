import { ConflictException, ForbiddenException } from '@nestjs/common'
import {
  MATH_7,
  TEACHER,
} from '../../../../question/application/question.repository.fake.js'
import { reviewWorld } from '../../package-review.test-support.js'
import { CopyExamPackageUseCase } from './copy-exam-package.use-case.js'

async function setup(status: 'APPROVED' | 'LOCKED' | 'DRAFT' = 'APPROVED') {
  const world = await reviewWorld(2)
  world.setStatus(status)
  const copier = (pairs = [MATH_7]) => {
    return new CopyExamPackageUseCase(
      world.packages,
      world.questions,
      pairs.length === 0 ? world.deniedScope : world.scope,
      world.employees,
    )
  }
  return { ...world, copier }
}

describe('CopyExamPackageUseCase', () => {
  it('copies an approved package into a draft with copies of its questions', async () => {
    const { copier, pkg, questionIds, questions } = await setup('APPROVED')

    const copy = await copier().execute(TEACHER, pkg.id)

    expect(copy.id).not.toBe(pkg.id)
    expect(copy.status).toBe('DRAFT')
    expect(copy.title).toBe('Salinan UTS Matematika')
    expect(copy.createdById).toBe(TEACHER.id)
    expect(copy.items.map((item) => item.position)).toEqual([1, 2])
    expect(copy.items.map((item) => item.questionId)).not.toEqual(questionIds)
    const lineage = copy.items.map(
      (item) => questions.questions.get(item.questionId)?.copiedFromQuestionId,
    )
    expect(lineage).toEqual(questionIds)
  })

  it('copies a locked package too', async () => {
    const { copier, pkg } = await setup('LOCKED')

    expect((await copier().execute(TEACHER, pkg.id)).items).toHaveLength(2)
  })

  it('refuses a package that is not approved or locked', async () => {
    const { copier, pkg } = await setup('DRAFT')

    await expect(copier().execute(TEACHER, pkg.id)).rejects.toThrow(
      ConflictException,
    )
  })

  it('cuts the title to 200 characters', async () => {
    const { copier, pkg, packages } = await setup('APPROVED')
    packages.packages.set(pkg.id, {
      ...packages.packages.get(pkg.id)!,
      title: 'x'.repeat(200),
    })

    const copy = await copier().execute(TEACHER, pkg.id)

    expect(copy.title).toHaveLength(200)
  })

  it('refuses a teacher outside the subject and grade', async () => {
    const { copier, pkg } = await setup('APPROVED')

    await expect(copier([]).execute(TEACHER, pkg.id)).rejects.toThrow(
      ForbiddenException,
    )
  })
})
