import 'reflect-metadata'
import { PERMISSIONS_KEY } from '../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { SessionExamController } from './session-exam.controller.js'

const expected: Record<string, string[]> = {
  questions: ['exam-sessions.take'],
  answers: ['exam-sessions.take'],
  save: ['exam-sessions.take'],
  submit: ['exam-sessions.take'],
  violations: ['exam-sessions.take'],
  file: ['exam-sessions.take'],
}

describe('SessionExamController permissions', () => {
  it.each(Object.entries(expected))('%s requires %j', (method, codes) => {
    const handler = SessionExamController.prototype[
      method as keyof SessionExamController
    ] as unknown as object

    expect(Reflect.getMetadata(PERMISSIONS_KEY, handler)).toEqual(codes)
  })

  it('leaves no route without a permission', () => {
    const routes = Object.getOwnPropertyNames(
      SessionExamController.prototype,
    ).filter((name) => name !== 'constructor')

    expect(routes.sort()).toEqual(Object.keys(expected).sort())
  })
})
