import type { AdmissionPaymentStatus } from '../../../../../shared/domain/enums/admission-payment-status.enum.js'

export interface VerifyPaymentInput {
  applicationId: string
  status: AdmissionPaymentStatus
  note?: string
  adminId: string
}
