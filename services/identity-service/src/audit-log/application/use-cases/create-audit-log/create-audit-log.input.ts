import { JsonObject } from '../../../../shared/domain/types/json.type.js'

export interface CreateAuditLogInput {
  userId?: string | null
  action: string
  resource: string
  resourceId?: string | null
  metadata?: JsonObject
  ipAddress?: string | null
  userAgent?: string | null
}
