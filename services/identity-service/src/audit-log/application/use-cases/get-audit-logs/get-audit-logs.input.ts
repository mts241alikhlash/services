export interface GetAuditLogsInput {
  page?: number
  limit?: number
  search?: string
  userId?: string
  action?: string
  resource?: string
}
