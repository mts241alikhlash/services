import 'reflect-metadata'
import { PERMISSIONS_KEY } from '../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { ExamMakeupController } from './exam-makeup.controller.js'

const expected: Record<string, string[]> = {
  absentees: ['exam-schedules.read'],
  makeup: ['exam-schedules.create'],
}

describe('ExamMakeupController permissions', () => {
  it.each(Object.entries(expected))('%s requires %j', (method, codes) => {
    const handler = ExamMakeupController.prototype[
      method as keyof ExamMakeupController
    ] as unknown as object

    expect(Reflect.getMetadata(PERMISSIONS_KEY, handler)).toEqual(codes)
  })

  it('leaves no route without a permission', () => {
    const routes = Object.getOwnPropertyNames(
      ExamMakeupController.prototype,
    ).filter((name) => name !== 'constructor')

    expect(routes.sort()).toEqual(Object.keys(expected).sort())
  })
})
