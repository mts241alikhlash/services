import 'reflect-metadata'
import { PERMISSIONS_KEY } from '../../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { AdmissionAdminController } from '../../../application/presentation/http/admission-admin.controller.js'
import { AdmissionEnrollmentController } from './admission-enrollment.controller.js'

function required(target: object, method: string): unknown {
  return Reflect.getMetadata(
    PERMISSIONS_KEY,
    (target as Record<string, unknown>)[method] as object,
  )
}

describe('enrollment permissions', () => {
  it.each([
    ['findAll', 'admission-enrollments.read'],
    ['preview', 'admission-enrollments.nis'],
    ['compose', 'admission-enrollments.nis'],
    ['lock', 'admission-enrollments.nis'],
    ['process', 'admission-enrollments.process'],
    ['setPlacement', 'admission-enrollments.process'],
  ])('%s requires %s', (method, permission) => {
    expect(required(AdmissionEnrollmentController.prototype, method)).toEqual([
      permission,
    ])
  })

  it('guards the detail page enroll with the process permission', () => {
    expect(required(AdmissionAdminController.prototype, 'enroll')).toEqual([
      'admission-enrollments.process',
    ])
  })
})
