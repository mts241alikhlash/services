import type { ReadinessDocument } from '../policies/application-readiness.policy.js'

export interface VerificationSnapshot {
  status: string
  documents: ReadinessDocument[]
  paymentStatus: string | null
}

export abstract class IAdmissionVerificationRepository {
  abstract findRequiredTypeIds(): Promise<string[]>
  abstract findSnapshot(
    applicationId: string,
  ): Promise<VerificationSnapshot | null>
  abstract markVerified(
    applicationId: string,
    verifiedById: string | null,
    requiredTypeIds: string[],
  ): Promise<boolean>
}
