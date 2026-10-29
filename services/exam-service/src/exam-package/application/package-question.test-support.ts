import { FakeQuestionRepository } from '../../question/application/question.repository.fake.js'
import {
  MATH_7,
  TEACHER,
  buildTeacherScope,
} from '../../question/application/question.repository.fake.js'
import type {
  ExamPackageDetail,
  ExamPackageStatus,
} from '../domain/entities/exam-package.entity.js'
import { FakeExamPackageRepository } from './exam-package.repository.fake.js'

export const TRUE_FALSE_INPUT = {
  type: 'TRUE_FALSE' as const,
  bodyHtml: '<p>Bumi bulat</p>',
  content: { answer: { value: true } },
  points: 1,
}

export async function packageWorld(
  options: { pairs?: { subjectId: string; gradeId: string }[] } = {},
) {
  const questions = new FakeQuestionRepository()
  const packages = new FakeExamPackageRepository(questions)
  const { scope, employees } = buildTeacherScope({
    employeeId: 'emp-1',
    pairs: options.pairs ?? [MATH_7],
  })
  const pkg = await packages.create({
    title: 'UTS Matematika',
    ...MATH_7,
    createdById: TEACHER.id,
    items: [],
  })
  const setStatus = (status: ExamPackageStatus) => {
    packages.packages.set(pkg.id, {
      ...pkg,
      ...packages.packages.get(pkg.id),
      status,
    })
  }
  const reload = async (): Promise<ExamPackageDetail> =>
    (await packages.findById(pkg.id)) as ExamPackageDetail
  return { questions, packages, scope, employees, pkg, setStatus, reload }
}
