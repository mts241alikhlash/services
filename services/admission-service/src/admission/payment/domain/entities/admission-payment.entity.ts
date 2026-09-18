import type { AdmissionPaymentStatus } from '../../../../shared/domain/enums/admission-payment-status.enum.js'
import type { DecimalValue } from '../../../../shared/domain/types/decimal.type.js'
import type { AdmissionFileRef } from '../../../document/index.js'

export interface AdmissionPaymentWithProof {
  id: string
  applicationId: string
  amount: DecimalValue
  status: `${AdmissionPaymentStatus}`
  proofFileId: string | null
  proofFile?: AdmissionFileRef | null
  note: string | null
  bankName: string | null
  senderAccountName: string | null
  transferDate: Date | null
  createdAt: Date
  updatedAt: Date
  verifiedById: string | null
  verifiedAt: Date | null
}
