export type ReviewTab = 'waiting' | 'revision' | 'done'

export interface ReviewQueueQuery {
  tab: ReviewTab
  search?: string
  waveId?: string
  page: number
  limit: number
}

export interface ReviewQueueRecord {
  applicationId: string
  registrationNumber: string
  applicantName: string
  waveName: string
  status: string
  submittedAt: Date | null
  documents: { documentTypeId: string; status: string }[]
}

export interface ReviewQueueCounts {
  waiting: number
  revision: number
  done: number
}

export interface ReviewQueueResult {
  records: ReviewQueueRecord[]
  total: number
  counts: ReviewQueueCounts
  requiredTypeIds: string[]
}

export interface ReviewFile {
  id: string
  originalName: string
  mimeType: string
  storageKey: string
}

export interface ReviewDocument {
  id: string
  documentTypeId: string
  status: string
  note: string | null
  verifiedAt: Date | null
  file: ReviewFile
}

export interface ReviewDocumentSlot {
  documentTypeId: string
  code: string
  name: string
  isRequired: boolean
  document: ReviewDocument | null
}

export interface ReviewContext {
  applicationId: string
  registrationNumber: string
  applicantName: string
  waveName: string
  status: string
  revisionNote: string | null
  submittedAt: Date | null
  paymentStatus: string | null
  slots: ReviewDocumentSlot[]
}

export interface SaveDecisionInput {
  applicationId: string
  documentId: string
  status: 'APPROVED' | 'REJECTED'
  note: string | null
  adminId: string
}

export type SaveDecisionResult =
  | { outcome: 'SAVED'; document: ReviewDocument }
  | { outcome: 'NOT_FOUND' }
  | { outcome: 'NOT_SUBMITTED' }
