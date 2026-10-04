import { AttendancePeriodEntity } from '../entities/attendance-period.entity.js'

export interface AttendancePeriodQueryInput {
  year?: number
  status?: 'OPEN' | 'CLOSED'
}

export interface ClosePeriodRepositoryInput {
  year: number
  month: number
  closedBy: string
  closedAt: Date
}

export abstract class IAttendancePeriodRepository {
  abstract findAll(
    query: AttendancePeriodQueryInput,
  ): Promise<AttendancePeriodEntity[]>
  abstract findByPeriod(
    year: number,
    month: number,
  ): Promise<AttendancePeriodEntity | null>
  abstract isClosed(year: number, month: number): Promise<boolean>
  abstract close(
    input: ClosePeriodRepositoryInput,
  ): Promise<AttendancePeriodEntity>
}
