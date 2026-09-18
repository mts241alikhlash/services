import { AttendancePeriodStatus } from '@prisma/client'

export type AttendancePeriodStatusEnum = `${AttendancePeriodStatus}`

export interface AttendancePeriodEntity {
  id: string
  year: number
  month: number
  status: AttendancePeriodStatusEnum
  closedAt?: Date | null
  closedBy?: string | null
  createdAt: Date
  updatedAt: Date
}
