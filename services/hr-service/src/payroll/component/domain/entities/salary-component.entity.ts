export type SalaryComponentTypeEnum =
  'BASE' | 'ALLOWANCE' | 'ATTENDANCE_DRIVEN' | 'DEDUCTION'
export type AttendanceDriverEnum =
  | 'PRESENT_DAYS'
  | 'ABSENT_DAYS'
  | 'LATE_COUNT'
  | 'LATE_MINUTES'
  | 'EARLY_LEAVE_COUNT'
  | 'LEAVE_DAYS'
  | 'OFFICIAL_DUTY_DAYS'

export interface SalaryComponentEntity {
  id: string
  code: string
  name: string
  type: SalaryComponentTypeEnum
  driver?: AttendanceDriverEnum | null
  isActive: boolean
  deletedAt?: Date | null
}
