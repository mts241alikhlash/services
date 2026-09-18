export interface ApprovalWorkflowStepEntity {
  id: string
  workflowId: string
  stepSequence: number
  approverRoleCode: string
  isMandatory: boolean
}

export interface ApprovalWorkflowEntity {
  id: string
  name: string
  targetEntity: string
  description?: string | null
  isActive: boolean
  steps?: ApprovalWorkflowStepEntity[]
}
