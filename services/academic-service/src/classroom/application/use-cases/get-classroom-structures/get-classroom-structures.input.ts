import { PaginationQueryInput } from '../../../../shared/domain/interfaces/repository.interface.js'

export interface GetClassroomStructuresInput extends PaginationQueryInput {
  classroomId?: string
  semesterId?: string
}
