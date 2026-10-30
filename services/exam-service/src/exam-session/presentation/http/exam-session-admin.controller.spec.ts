import 'reflect-metadata'
import { PERMISSIONS_KEY } from '../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { ExamSessionAdminController } from './exam-session-admin.controller.js'

const expected: Record<string, string[]> = {
  findBySchedule: ['exam-sessions.read'],
  release: ['exam-sessions.release'],
  streams: ['exam-sessions.read'],
}

describe('ExamSessionAdminController permissions', () => {
  it.each(Object.entries(expected))('%s requires %j', (method, codes) => {
    const handler = ExamSessionAdminController.prototype[
      method as keyof ExamSessionAdminController
    ] as unknown as object

    expect(Reflect.getMetadata(PERMISSIONS_KEY, handler)).toEqual(codes)
  })

  it('leaves no route without a permission', () => {
    const routes = Object.getOwnPropertyNames(
      ExamSessionAdminController.prototype,
    ).filter((name) => name !== 'constructor')

    expect(routes.sort()).toEqual(Object.keys(expected).sort())
  })
})
