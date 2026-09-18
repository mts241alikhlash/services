import { AttendanceDriver, SalaryComponentType } from '@prisma/client'

export type SalaryComponentTypeEnum = `${SalaryComponentType}`
export type AttendanceDriverEnum = `${AttendanceDriver}`

export interface SalaryComponentEntity {
  id: string
  code: string
  name: string
  type: SalaryComponentTypeEnum
  driver?: AttendanceDriverEnum | null
  isActive: boolean
  deletedAt?: Date | null
}
