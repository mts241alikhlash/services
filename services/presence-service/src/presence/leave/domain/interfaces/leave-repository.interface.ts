import { PresenceSubjectTypeEnum } from '../../../credential/domain/entities/credential.entity.js'
import {
  LeaveBalanceRow,
  LeaveRequestStatusEnum,
  LeaveRequestWithDetails,
  LeaveTypeEntity,
} from '../entities/leave.entity.js'

export type { LeaveBalanceRow, LeaveRequestWithDetails, LeaveTypeEntity }

export interface CreateLeaveTypeInput {
  code: string
  name: string
  treatment: 'ON_LEAVE' | 'OFFICIAL_DUTY'
  consumesQuota: boolean
  annualQuota?: number | null
  requiresDocument: boolean
  appliesTo: PresenceSubjectTypeEnum
}

export type UpdateLeaveTypeInput = Partial<CreateLeaveTypeInput> & {
  isActive?: boolean
}

export interface SubmitLeaveInput {
  requesterId: string
  leaveTypeId: string
  startDate: Date
  endDate: Date
  reason: string
  documentFileId?: string | null
  workingDayCount: number
  days: Date[]
}

export interface LeaveRequestQueryInput {
  requesterId?: string
  status?: LeaveRequestStatusEnum
  year?: number
}

export interface DecideLeaveInput {
  approverId: string
  decidedAt: Date
  decisionReason?: string | null
}

export abstract class ILeaveRepository {
  abstract findTypes(includeInactive?: boolean): Promise<LeaveTypeEntity[]>
  abstract findTypeById(id: string): Promise<LeaveTypeEntity | null>
  abstract createType(input: CreateLeaveTypeInput): Promise<LeaveTypeEntity>
  abstract updateType(
    id: string,
    input: UpdateLeaveTypeInput,
  ): Promise<LeaveTypeEntity>
  abstract softDeleteType(id: string): Promise<LeaveTypeEntity>
  abstract countRequestsOfType(leaveTypeId: string): Promise<number>

  abstract findRequests(
    query: LeaveRequestQueryInput,
  ): Promise<LeaveRequestWithDetails[]>
  abstract findRequestById(id: string): Promise<LeaveRequestWithDetails | null>
  abstract submit(input: SubmitLeaveInput): Promise<LeaveRequestWithDetails>

  abstract approve(
    id: string,
    input: DecideLeaveInput,
    treatment: 'ON_LEAVE' | 'OFFICIAL_DUTY',
    subjectType: PresenceSubjectTypeEnum,
  ): Promise<LeaveRequestWithDetails>

  abstract reject(
    id: string,
    input: DecideLeaveInput,
  ): Promise<LeaveRequestWithDetails>
  abstract withdraw(id: string): Promise<LeaveRequestWithDetails>

  abstract findBalances(
    userId: string,
    year: number,
  ): Promise<LeaveBalanceRow[]>
  abstract countUsedDays(
    userId: string,
    leaveTypeId: string,
    year: number,
  ): Promise<number>
}
