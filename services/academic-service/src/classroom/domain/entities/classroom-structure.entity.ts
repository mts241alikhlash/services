import type { SemesterRef } from '../../../shared/domain/entities/index.js'
import type { StudentPersonRef } from '../../../shared/utils/resolve-person-refs.helper.js'
import type { ClassroomEntity } from './classroom.entity.js'

export interface ClassroomStructureEntity {
  id: string
  classroomId: string
  semesterId: string
  presidentId?: string | null
  vicePresidentId?: string | null
  secretaryId?: string | null
  treasurerId?: string | null
  deletedAt?: Date | null
}

export interface StructureWithDetails extends ClassroomStructureEntity {
  classroom?: ClassroomEntity
  semester?: SemesterRef
  president?: StudentPersonRef | null
  vicePresident?: StudentPersonRef | null
  secretary?: StudentPersonRef | null
  treasurer?: StudentPersonRef | null
}
