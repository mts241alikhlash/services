import { AdmissionStatus as AdmissionStatusEnum } from '../../../../shared/domain/enums/admission-status.enum.js'

export class AdmissionStatusTransitionError extends Error {}

type AdmissionStatus = `${AdmissionStatusEnum}`

const ALLOWED_TRANSITIONS: Record<AdmissionStatus, AdmissionStatus[]> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['REVISION_NEEDED', 'VERIFIED', 'REJECTED'],
  REVISION_NEEDED: ['SUBMITTED'],
  VERIFIED: ['ACCEPTED', 'REJECTED'],
  ACCEPTED: ['ENROLLING'],
  ENROLLING: ['ENROLLING', 'ENROLLED'],
  REJECTED: [],
  ENROLLED: [],
}

export const EDITABLE_STATUSES: AdmissionStatus[] = ['DRAFT', 'REVISION_NEEDED']

export function assertTransition(
  from: AdmissionStatus,
  to: AdmissionStatus,
): void {
  if (!ALLOWED_TRANSITIONS[from].includes(to)) {
    throw new AdmissionStatusTransitionError(
      `Invalid status transition: ${from} → ${to}`,
    )
  }
}

export function isEditable(status: AdmissionStatus): boolean {
  return EDITABLE_STATUSES.includes(status)
}
