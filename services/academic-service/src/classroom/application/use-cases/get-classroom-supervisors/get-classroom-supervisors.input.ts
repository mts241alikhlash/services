import { PaginationQueryInput } from '../../../../shared/domain/interfaces/repository.interface.js'

export interface GetClassroomSupervisorsInput extends PaginationQueryInput {
  classroomId?: string
  employeeId?: string
  semesterId?: string
}
