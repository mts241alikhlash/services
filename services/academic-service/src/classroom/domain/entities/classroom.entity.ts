import type {
  AcademicYearRef,
  GradeRef,
} from '../../../shared/domain/entities/index.js'
import type { EmployeePersonRef } from '../../../shared/utils/resolve-person-refs.helper.js'

export interface ClassroomEntity {
  id: string
  gradeId: string
  academicYearId: string
  code: string
  name: string | null
  capacity: number
  isActive?: boolean
  deletedAt?: Date | null
}

export interface ClassroomSupervisorSlot {
  id: string
  classroomId: string
  employeeId: string
  semesterId: string
  deletedAt?: Date | null
  employee?: EmployeePersonRef
}

export interface ClassroomWithDetails extends ClassroomEntity {
  grade?: GradeRef
  academicYear?: AcademicYearRef
  classroomSupervisors?: ClassroomSupervisorSlot[]
}
