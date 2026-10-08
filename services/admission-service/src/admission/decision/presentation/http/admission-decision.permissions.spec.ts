import 'reflect-metadata'
import { PERMISSIONS_KEY } from '../../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { AdmissionAdminController } from '../../../application/presentation/http/admission-admin.controller.js'
import { AdmissionDecisionController } from './admission-decision.controller.js'

function required(target: object, method: string): unknown {
  return Reflect.getMetadata(
    PERMISSIONS_KEY,
    (target as Record<string, unknown>)[method] as object,
  )
}

describe('decision permissions', () => {
  it.each([
    ['findAll', 'admission-decisions.read'],
    ['accept', 'admission-decisions.decide'],
    ['reject', 'admission-decisions.decide'],
    ['acceptMany', 'admission-decisions.decide'],
    ['cancelAcceptance', 'admission-decisions.decide'],
    ['cancelRejection', 'admission-decisions.decide'],
  ])('%s requires %s', (method, permission) => {
    expect(required(AdmissionDecisionController.prototype, method)).toEqual([
      permission,
    ])
  })

  it('guards the detail page accept and reject with the decision permission', () => {
    const admin = AdmissionAdminController.prototype
    expect(required(admin, 'accept')).toEqual(['admission-decisions.decide'])
    expect(required(admin, 'reject')).toEqual(['admission-decisions.decide'])
    expect(required(admin, 'enroll')).toEqual(['admission-enrolments.process'])
  })
})
