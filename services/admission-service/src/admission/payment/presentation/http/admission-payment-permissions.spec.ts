import 'reflect-metadata'
import { PERMISSIONS_KEY } from '../../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { AdmissionAdminController } from '../../../application/presentation/http/admission-admin.controller.js'
import { AdmissionPaymentAdminController } from './admission-payment-admin.controller.js'

function required(target: object, method: string): unknown {
  return Reflect.getMetadata(
    PERMISSIONS_KEY,
    (target as Record<string, unknown>)[method] as object,
  )
}

describe('payment queue permissions', () => {
  const queue = AdmissionPaymentAdminController.prototype

  it.each([
    ['findAll', 'admission-payments.read'],
    ['findEligible', 'admission-payments.create'],
    ['create', 'admission-payments.create'],
    ['verify', 'admission-payments.verify'],
    ['cancel', 'admission-payments.verify'],
  ])('%s requires %s', (method, permission) => {
    expect(required(queue, method)).toEqual([permission])
  })

  it('guards the detail page payment verification with the payment permission, not admissions.verify', () => {
    expect(
      required(AdmissionAdminController.prototype, 'verifyPayment'),
    ).toEqual(['admission-payments.verify'])
  })

  it('guards document verification and finalisation with admission-documents.verify', () => {
    const admin = AdmissionAdminController.prototype
    for (const method of [
      'verifyDocument',
      'requestRevision',
      'verifyApplication',
    ]) {
      expect(required(admin, method)).toEqual(['admission-documents.verify'])
    }
  })
})
