import 'reflect-metadata'
import { PERMISSIONS_KEY } from '../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { ExamGradingController } from './exam-grading.controller.js'

const expected: Record<string, string[]> = {
  schedules: ['exam-grading.read'],
  sessions: ['exam-grading.read'],
  session: ['exam-grading.read'],
}

describe('ExamGradingController permissions', () => {
  it.each(Object.entries(expected))('%s requires %j', (method, codes) => {
    const handler = ExamGradingController.prototype[
      method as keyof ExamGradingController
    ] as unknown as object

    expect(Reflect.getMetadata(PERMISSIONS_KEY, handler)).toEqual(codes)
  })

  it('leaves no route without a permission', () => {
    const routes = Object.getOwnPropertyNames(
      ExamGradingController.prototype,
    ).filter((name) => name !== 'constructor')

    expect(routes.sort()).toEqual(Object.keys(expected).sort())
  })
})
