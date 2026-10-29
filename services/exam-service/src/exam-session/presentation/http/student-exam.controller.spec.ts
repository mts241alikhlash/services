import 'reflect-metadata'
import { PERMISSIONS_KEY } from '../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { StudentExamController } from './student-exam.controller.js'

const expected: Record<string, string[]> = {
  findMine: ['exam-sessions.take'],
  start: ['exam-sessions.take'],
}

describe('StudentExamController permissions', () => {
  it.each(Object.entries(expected))('%s requires %j', (method, codes) => {
    const handler = StudentExamController.prototype[
      method as keyof StudentExamController
    ] as unknown as object

    expect(Reflect.getMetadata(PERMISSIONS_KEY, handler)).toEqual(codes)
  })

  it('leaves no route without a permission', () => {
    const routes = Object.getOwnPropertyNames(
      StudentExamController.prototype,
    ).filter((name) => name !== 'constructor')

    expect(routes.sort()).toEqual(Object.keys(expected).sort())
  })
})
