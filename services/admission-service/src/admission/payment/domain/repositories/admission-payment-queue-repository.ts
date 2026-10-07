import type { AdmissionPaymentStatus } from '../../../../shared/domain/enums/admission-payment-status.enum.js'
import type { DecimalValue } from '../../../../shared/domain/types/decimal.type.js'
import type { AdmissionFileRef } from '../../../document/index.js'
import type { AdmissionPaymentBankAccountRef } from '../entities/admission-payment.entity.js'

export type PaymentQueueStatus = 'PENDING' | 'VERIFIED' | 'REJECTED'

export interface PaymentQueueQuery {
  status: PaymentQueueStatus
  search?: string
  waveId?: string
  page: number
  limit: number
}

export interface PaymentQueueRow {
  paymentId: string
  applicationId: string
  registrationNumber: string
  applicantName: string
  applicationStatus: string
  waveId: string
  waveName: string
  amount: DecimalValue
  status: `${AdmissionPaymentStatus}`
  note: string | null
  bankName: string | null
  senderAccountName: string | null
  transferDate: Date | null
  bankAccount: AdmissionPaymentBankAccountRef | null
  proofFile: AdmissionFileRef | null
  proofUploadedByStaff: boolean
  verifiedById: string | null
  verifiedAt: Date | null
  updatedAt: Date
}

export interface PaymentQueueCounts {
  pending: number
  verified: number
  rejected: number
}

export interface PaymentQueueResult {
  rows: PaymentQueueRow[]
  total: number
  counts: PaymentQueueCounts
}

export interface EligibleApplicationRow {
  applicationId: string
  registrationNumber: string
  applicantName: string
  applicationStatus: string
  waveName: string
  amount: DecimalValue
}

export abstract class IAdmissionPaymentQueueRepository {
  abstract findQueue(query: PaymentQueueQuery): Promise<PaymentQueueResult>
  abstract findEligibleApplications(
    search: string | undefined,
    limit: number,
  ): Promise<EligibleApplicationRow[]>
}
