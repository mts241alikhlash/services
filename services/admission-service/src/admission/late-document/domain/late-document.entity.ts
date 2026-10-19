import type {
  LateDocumentState,
  LateDocumentUrgency,
} from './late-document.policy.js'

export const TRACKED_STATUSES = [
  'SUBMITTED',
  'REVISION_NEEDED',
  'VERIFIED',
  'ACCEPTED',
  'ENROLLING',
  'ENROLLED',
] as const

export interface LateDocumentType {
  id: string
  code: string
  name: string
  lateDueMonths: number | null
}

export interface LateDocumentPair {
  applicationId: string
  registrationNumber: string
  applicantName: string
  applicationStatus: string
  waveId: string
  waveName: string
  gradeLevel: number | null
  documentType: LateDocumentType
  document: {
    id: string
    fileId: string
    status: 'PENDING' | 'APPROVED' | 'REJECTED'
    note: string | null
  } | null
}

export interface LateDocumentRow {
  applicationId: string
  registrationNumber: string
  applicantName: string
  applicationStatus: string
  waveName: string
  gradeLevel: number | null
  documentTypeId: string
  documentTypeName: string
  documentId: string | null
  fileId: string | null
  state: LateDocumentState
  urgency: LateDocumentUrgency
  limitDate: Date | null
  note: string | null
}

export type LateDocumentStateFilter = 'OPEN' | LateDocumentState

export interface LateDocumentQuery {
  page?: number
  limit?: number
  search?: string
  documentTypeId?: string
  waveId?: string
  state?: LateDocumentStateFilter
}
