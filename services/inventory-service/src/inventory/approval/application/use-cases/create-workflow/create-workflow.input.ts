export interface CreateWorkflowStepInput {
  stepSequence: number
  approverRoleCode: string
  isMandatory?: boolean
}

export interface CreateWorkflowInput {
  name: string
  targetEntity: string
  description?: string
  steps: CreateWorkflowStepInput[]
}
