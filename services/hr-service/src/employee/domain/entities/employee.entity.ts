import type {
  NamedRef,
  ProfileRosterRef,
  UserRef,
} from '../../../shared/domain/entities/index.js'
import type { EmployeePositionWithDetails } from './employee-position.entity.js'

export interface EmployeeEntity {
  id: string
  userId: string
  nip?: string | null
  nuptk?: string | null
  employmentTypeId?: string | null
  joinDate?: Date | null
  deletedAt?: Date | null
}

export interface EmployeeAssignmentRef {
  id: string
  classroomId: string
  subjectId: string
  semesterId: string
}

export interface EmployeeWithDetails extends EmployeeEntity {
  user: UserRef
  employmentType?: NamedRef | null
  positions?: EmployeePositionWithDetails[]
  teachingAssignments?: EmployeeAssignmentRef[]
}

export type EmployeeListWithDetails = Omit<EmployeeWithDetails, 'user'> & {
  user: UserRef<ProfileRosterRef>
}

export interface EmployeeExportProfileRef extends ProfileRosterRef {
  birthPlace: string
  birthDate: Date
  email: string | null
  phone: string | null
}

export type EmployeeExportWithDetails = Omit<EmployeeWithDetails, 'user'> & {
  user: UserRef<EmployeeExportProfileRef>
}
