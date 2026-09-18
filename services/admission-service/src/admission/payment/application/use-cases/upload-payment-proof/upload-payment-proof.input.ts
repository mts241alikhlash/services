import type { AdmissionUploadFile } from '../../../domain/repositories/admission-payment-repository.js'

export interface UploadPaymentProofInput {
  userId: string
  bankName: string
  senderAccountName: string
  transferDate?: Date | null
  file: AdmissionUploadFile
}

export interface UploadPaymentProofForApplicationInput {
  applicationId: string
  bankName: string
  senderAccountName: string
  transferDate?: Date | null
  file: AdmissionUploadFile
  adminId: string
}
