import type { AdmissionPaymentStatus } from '../../../../shared/domain/enums/admission-payment-status.enum.js'
import type {
  CreateDocumentFileInput,
  AdmissionUploadFile,
} from '../../../document/index.js'
import type { AdmissionPaymentWithProof } from '../entities/admission-payment.entity.js'

export interface AdmissionPaymentApplicationRef {
  status: string
  payment: AdmissionPaymentWithProof | null
}

export interface SavePaymentProofInput {
  paymentId: string
  file: CreateDocumentFileInput
  bankName: string
  senderAccountName: string
  transferDate: Date | null
}

export interface UpdatePaymentStatusInput {
  status: AdmissionPaymentStatus
  note: string | null
  adminId: string
}

export abstract class IAdmissionPaymentRepository {
  abstract findApplicationWithPayment(
    userId: string,
  ): Promise<AdmissionPaymentApplicationRef | null>
  abstract findByApplicationId(
    applicationId: string,
  ): Promise<AdmissionPaymentApplicationRef | null>
  abstract savePaymentProof(
    input: SavePaymentProofInput,
  ): Promise<AdmissionPaymentWithProof>
  abstract findPayment(
    applicationId: string,
  ): Promise<AdmissionPaymentWithProof | null>
  abstract updatePaymentStatus(
    paymentId: string,
    input: UpdatePaymentStatusInput,
  ): Promise<AdmissionPaymentWithProof>
}

export type { AdmissionUploadFile }
