import { ApprovalLogEntity } from './approval-log.entity.js'
import { ApprovalWorkflowEntity } from './approval-workflow.entity.js'

export interface ApprovalInstanceEntity {
  id: string
  workflowId: string
  referenceId: string
  statusId?: string | null
  currentStepSequence: number
  workflow?: ApprovalWorkflowEntity | null
  logs?: ApprovalLogEntity[]
}
