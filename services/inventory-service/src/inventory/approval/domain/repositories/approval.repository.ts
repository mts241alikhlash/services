export interface ApprovalWorkflowStepRepositoryOutput {
  id: string
  workflowId: string
  stepSequence: number
  approverRoleCode: string
  isMandatory: boolean
  createdAt: Date
}

export interface ApprovalWorkflowRepositoryOutput {
  id: string
  name: string
  targetEntity: string
  description?: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  steps?: ApprovalWorkflowStepRepositoryOutput[]
}

export interface ApprovalLogRepositoryOutput {
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

export type ApprovalConsequenceType = 'NONE' | 'FINAL_APPROVAL' | 'REJECTION'

export type ApprovalConsequenceStatus =
  'NOT_REQUIRED' | 'PENDING' | 'COMPLETED' | 'FAILED'

export interface ProcessApprovalConsequence {
  type: ApprovalConsequenceType
  status: ApprovalConsequenceStatus
  error?: string
}

export interface ApprovalConsequenceTransitionResult {
  log: ApprovalLogRepositoryOutput | null
  transitioned: boolean
}

export interface ApprovalInstanceRepositoryOutput {
  id: string
  workflowId: string
  referenceId: string
  statusId: string
  currentStepSequence: number
  createdAt: Date
  updatedAt: Date
  workflow?: ApprovalWorkflowRepositoryOutput | null
  logs?: ApprovalLogRepositoryOutput[]
}

export interface CreateApprovalWorkflowStepInput {
  stepSequence: number
  approverRoleCode: string
  isMandatory?: boolean
}

export interface CreateApprovalWorkflowInput {
  name: string
  targetEntity: string
  description?: string | null
  isActive?: boolean
  steps: CreateApprovalWorkflowStepInput[]
}

export interface UpdateApprovalInstanceInput {
  statusId?: string
  currentStepSequence?: number
}

export interface CreateApprovalLogInput {
  instanceId: string
  stepSequence: number
  approverId: string
  actionId: string
  note?: string | null
}

export interface ProcessApprovalLocalTransactionInput {
  instanceId: string
  currentStepSequence: number
  action: 'APPROVE' | 'REJECT'
  userId: string
  note?: string | null
  statusId?: string
  hasNextStep: boolean
  nextStepSequence?: number
  consequenceType: ApprovalConsequenceType
}

export interface ProcessApprovalResult {
  success: boolean
  action: 'REJECT' | 'APPROVE_STEP' | 'APPROVE_FINAL'
  nextStepSequence?: number
  log: ApprovalLogRepositoryOutput
  consequence: ProcessApprovalConsequence
  retryable: boolean
}

export interface ApprovalStatusRepositoryOutput {
  id: string
}

export interface ApprovalWorkflowCapabilityOutput {
  id: string
}

export interface CreateApprovalInstanceCapabilityInput {
  workflowId: string
  referenceId: string
  statusId: string
}

export interface ApprovalInstanceCapabilityOutput {
  id: string
}

export abstract class IApprovalRepository {
  abstract findAllWorkflows(): Promise<ApprovalWorkflowRepositoryOutput[]>
  abstract findWorkflowById(
    id: string,
  ): Promise<ApprovalWorkflowRepositoryOutput | null>
  abstract createWorkflow(
    input: CreateApprovalWorkflowInput,
  ): Promise<ApprovalWorkflowRepositoryOutput>
  abstract findInstanceById(
    id: string,
  ): Promise<ApprovalInstanceRepositoryOutput | null>
  abstract updateInstance(
    id: string,
    input: UpdateApprovalInstanceInput,
  ): Promise<ApprovalInstanceRepositoryOutput>
  abstract createLog(
    input: CreateApprovalLogInput,
  ): Promise<ApprovalLogRepositoryOutput>
  abstract findPendingInstancesForRoles(
    roleCodes: string[],
    pendingStatusId: string,
  ): Promise<ApprovalInstanceRepositoryOutput[]>
  abstract processApprovalTransaction(
    params: ProcessApprovalLocalTransactionInput,
  ): Promise<ProcessApprovalResult>
  abstract transitionLogConsequence(
    logId: string,
    expectedStatus: ApprovalConsequenceStatus,
    nextStatus: ApprovalConsequenceStatus,
    safeError?: string | null,
    expectedUpdatedAt?: Date,
  ): Promise<ApprovalConsequenceTransitionResult>
}

export abstract class IApprovalCapabilityPort {
  abstract findActiveWorkflow(
    targetEntity: string,
  ): Promise<ApprovalWorkflowCapabilityOutput | null>
  abstract createInstance(
    input: CreateApprovalInstanceCapabilityInput,
  ): Promise<ApprovalInstanceCapabilityOutput>
}
