import { ScanOutcome } from '@prisma/client'
import { ScanFeedback } from '../../../daily-record/domain/entities/daily-presence.entity.js'

export type ScanOutcomeEnum = `${ScanOutcome}`

export interface ScanEntity {
  id: string
  deviceId: string
  credentialId?: string | null
  presentedCode: string
  clientEventId: string
  occurredAt: Date
  receivedAt: Date
  outcome: ScanOutcomeEnum
  rejectionReason?: string | null
}

export interface ScanHolderRef {
  displayName: string | null
  subjectType: string
  photoUrl: string | null
}

export interface ScanResult extends ScanFeedback {
  outcome: ScanOutcomeEnum
  person?: ScanHolderRef
  rejectionReason?: string
  leaveConflict?: boolean
}

export interface BatchScanResult {
  clientEventId: string
  outcome: ScanOutcomeEnum
  accepted: boolean
}
