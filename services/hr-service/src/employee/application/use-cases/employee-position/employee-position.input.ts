export interface CreateEmployeePositionInput {
  positionId: string
  hireDate: string | Date
  isPrimary?: boolean
}

export interface UpdateEmployeePositionInput {
  isPrimary?: boolean
  hireDate?: string | Date
}
