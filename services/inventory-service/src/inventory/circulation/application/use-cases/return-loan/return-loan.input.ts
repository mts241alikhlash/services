export interface ReturnLoanItemInput {
  unitId: string
  returnedConditionId: string
  notes?: string
}

export interface ReturnLoanInput {
  items: ReturnLoanItemInput[]
}
