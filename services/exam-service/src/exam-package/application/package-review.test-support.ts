import {
  MATH_7,
  buildTeacherScope,
} from '../../question/application/question.repository.fake.js'
import { AddPackageQuestionUseCase } from './use-cases/add-package-question/add-package-question.use-case.js'
import {
  TRUE_FALSE_INPUT,
  packageWorld,
} from './package-question.test-support.js'

export const AUTHOR = {
  id: 'user-1',
  roles: ['TEACHER'],
  permissions: ['exam-questions.read'],
}

export const REVIEWER = {
  id: 'user-3',
  roles: ['CURRICULUM_STAFF'],
  permissions: ['exam-questions.approve'],
}

export const ADMIN = {
  id: 'user-1',
  roles: ['ADMIN'],
  permissions: ['exam-questions.approve', 'exam-questions.manage-all'],
}

export async function reviewWorld(questionCount = 2) {
  const world = await packageWorld()
  const add = new AddPackageQuestionUseCase(
    world.packages,
    world.questions,
    world.scope,
    world.employees,
  )
  let last = world.pkg
  for (let index = 0; index < questionCount; index += 1) {
    last = await add.execute(AUTHOR, world.pkg.id, TRUE_FALSE_INPUT)
  }
  const { scope: deniedScope } = buildTeacherScope({
    employeeId: 'emp-1',
    pairs: [],
  })
  return {
    ...world,
    deniedScope,
    subject: MATH_7,
    questionIds: last.items.map((item) => item.questionId),
  }
}
