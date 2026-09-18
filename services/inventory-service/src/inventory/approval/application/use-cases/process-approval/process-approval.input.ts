export interface ProcessApprovalInput {
  action: 'APPROVE' | 'REJECT'
  note?: string
  forwardToNextApprover?: boolean
}
