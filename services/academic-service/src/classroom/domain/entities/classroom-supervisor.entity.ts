import type { SemesterRef } from '../../../shared/domain/entities/index.js'
import type { EmployeePersonRef } from '../../../shared/utils/resolve-person-refs.helper.js'
import type { ClassroomEntity } from './classroom.entity.js'

export interface ClassroomSupervisorEntity {
  id: string
  classroomId: string
  employeeId: string
  semesterId: string
  deletedAt?: Date | null
}

export interface SupervisorWithDetails extends ClassroomSupervisorEntity {
  classroom?: ClassroomEntity
  employee?: EmployeePersonRef
  semester?: SemesterRef
}
