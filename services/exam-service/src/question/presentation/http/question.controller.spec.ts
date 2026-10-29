import 'reflect-metadata'
import { PERMISSIONS_KEY } from '../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import {
  MATH_7,
  TEACHER,
  buildTeacherScope,
} from '../../application/question.repository.fake.js'
import { GetQuestionScopeUseCase } from '../../application/use-cases/get-question-scope/get-question-scope.use-case.js'
import { QuestionController } from './question.controller.js'

describe('QuestionController', () => {
  it('answers with the subjects and grades the user may use', async () => {
    const { scope, academic, employees } = buildTeacherScope({
      employeeId: 'emp-1',
      pairs: [MATH_7],
    })
    const controller = new QuestionController(
      new GetQuestionScopeUseCase(scope, academic, employees),
    )

    const result = await controller.scope(TEACHER)

    expect(result.all).toBe(false)
    expect(result.employeeId).toBe('emp-1')
    expect(result.pairs.map((pair) => pair.subjectId)).toEqual(['math'])
  })

  it('needs the package read permission and has no other route', () => {
    expect(
      Reflect.getMetadata(
        PERMISSIONS_KEY,
        QuestionController.prototype.scope as unknown as object,
      ),
    ).toEqual(['exam-packages.read'])
    expect(
      Object.getOwnPropertyNames(QuestionController.prototype).filter(
        (name) => name !== 'constructor',
      ),
    ).toEqual(['scope'])
  })
})
