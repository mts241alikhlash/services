import type {
  ApprovalConsequenceStatus,
  ApprovalConsequenceType,
} from '../repositories/approval.repository.js'

export interface ApprovalLogEntity {
  id: string
  instanceId: string
  stepSequence: number
  approverId: string
  actionId: string
  note?: string | null
  createdAt: Date
  consequenceType: ApprovalConsequenceType
  consequenceStatus: ApprovalConsequenceStatus
  consequenceError: string | null
  consequenceUpdatedAt: Date
}
