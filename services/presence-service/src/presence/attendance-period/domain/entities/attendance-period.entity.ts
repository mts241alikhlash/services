export type AttendancePeriodStatusEnum = 'OPEN' | 'CLOSED'

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
