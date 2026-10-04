import {
  AttendanceDriverEnum,
  SalaryComponentTypeEnum,
} from '../../../component/domain/entities/salary-component.entity.js'

export interface PayslipAttendance {
  presentDays: number
  absentDays: number
  lateCount: number
  lateMinutes: number
  earlyLeaveCount: number
  leaveDays: number
  officialDutyDays: number
}

export interface PayslipLineEntity {
  componentId: string | null
  componentCode: string
  componentName: string
  componentType: SalaryComponentTypeEnum
  amount: number
  driver: AttendanceDriverEnum | null
  driverCount: number | null
  rate: string | null
}

export interface ComposedPayslip {
  userId: string
  gross: number
  deductions: number
  net: number
  attendance: PayslipAttendance
  lines: PayslipLineEntity[]
}
