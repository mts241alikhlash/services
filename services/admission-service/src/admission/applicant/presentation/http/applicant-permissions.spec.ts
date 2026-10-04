import 'reflect-metadata'
import { PERMISSIONS_KEY } from '../../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { AdmissionNotificationController } from '../../../notification/presentation/http/admission-notification.controller.js'
import { AdmissionApplicantController } from './admission-applicant.controller.js'

function required(target: object, method: string): unknown {
  return Reflect.getMetadata(
    PERMISSIONS_KEY,
    (target as Record<string, unknown>)[method] as object,
  )
}

describe('applicant self-service', () => {
  const applicant = AdmissionApplicantController.prototype
  const notifications = AdmissionNotificationController.prototype

  it.each([
    'getMyApplication',
    'ensureMyApplication',
    'updateMyApplication',
    'submit',
    'uploadDocument',
    'uploadAttachment',
    'uploadPaymentProof',
  ])('%s requires admissions.apply', (method) => {
    expect(required(applicant, method)).toEqual(['admissions.apply'])
  })

  it.each(['getNotifications', 'markAllRead', 'markRead'])(
    'notifications %s requires admissions.apply',
    (method) => {
      expect(required(notifications, method)).toEqual(['admissions.apply'])
    },
  )

  it.each(['getFormOptions', 'getAnnouncements'])(
    '%s stays open to any signed-in user',
    (method) => {
      expect(required(applicant, method)).toBeUndefined()
    },
  )
})
