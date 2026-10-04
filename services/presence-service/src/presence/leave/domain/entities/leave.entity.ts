import { PresenceSubjectTypeEnum } from '../../../credential/domain/entities/credential.entity.js'

export type LeaveTreatmentEnum = 'ON_LEAVE' | 'OFFICIAL_DUTY'
export type LeaveRequestStatusEnum =
  'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN'

export interface LeaveTypeEntity {
  id: string
  code: string
  name: string
  treatment: LeaveTreatmentEnum
  consumesQuota: boolean
  annualQuota?: number | null
  requiresDocument: boolean
  appliesTo: PresenceSubjectTypeEnum
  isActive: boolean
  deletedAt?: Date | null
}

export interface LeaveRequestEntity {
  id: string
  requesterId: string
  leaveTypeId: string
  startDate: Date
  endDate: Date
  reason: string
  documentFileId?: string | null
  status: LeaveRequestStatusEnum
  approverId?: string | null
  decidedAt?: Date | null
  decisionReason?: string | null
  workingDayCount: number
  deletedAt?: Date | null
  createdAt: Date
  updatedAt?: Date
}

export interface LeavePersonRef {
  id: string
  displayName: string | null
}

export interface LeaveTypeRef {
  id: string
  code: string
  name: string
  treatment: LeaveTreatmentEnum
}

export interface LeaveRequestWithDetails extends LeaveRequestEntity {
  requester: LeavePersonRef
  approver?: LeavePersonRef | null
  leaveType: LeaveTypeRef
  days: Date[]
}

export interface LeaveBalanceRow {
  leaveTypeId: string
  code: string
  name: string
  year: number
  quota: number
  used: number
  remaining: number
}
