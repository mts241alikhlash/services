import 'reflect-metadata'
import { PERMISSIONS_KEY } from '../../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { AdmissionAdminController } from '../../../application/presentation/http/admission-admin.controller.js'
import { AdmissionEnrolmentController } from './admission-enrolment.controller.js'

function required(target: object, method: string): unknown {
  return Reflect.getMetadata(
    PERMISSIONS_KEY,
    (target as Record<string, unknown>)[method] as object,
  )
}

describe('enrolment permissions', () => {
  it.each([
    ['findAll', 'admission-enrolments.read'],
    ['preview', 'admission-enrolments.nis'],
    ['compose', 'admission-enrolments.nis'],
    ['lock', 'admission-enrolments.nis'],
    ['process', 'admission-enrolments.process'],
    ['setPlacement', 'admission-enrolments.process'],
  ])('%s requires %s', (method, permission) => {
    expect(required(AdmissionEnrolmentController.prototype, method)).toEqual([
      permission,
    ])
  })

  it('guards the detail page enrol with the process permission', () => {
    expect(required(AdmissionAdminController.prototype, 'enroll')).toEqual([
      'admission-enrolments.process',
    ])
  })
})
