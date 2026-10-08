export type DecisionTab = 'waiting' | 'accepted' | 'rejected'

export interface DecisionQueueQuery {
  tab: DecisionTab
  search?: string
  waveId?: string
  page: number
  limit: number
}

export interface DecisionQueueRecord {
  applicationId: string
  registrationNumber: string
  applicantName: string
  waveName: string
  status: string
  submittedAt: Date | null
  verifiedAt: Date | null
  decidedAt: Date | null
  decisionNote: string | null
  paymentStatus: string | null
  documents: { documentTypeId: string; status: string }[]
}

export interface DecisionQueueResult {
  records: DecisionQueueRecord[]
  total: number
  counts: { waiting: number; accepted: number; rejected: number }
  requiredTypeIds: string[]
}
