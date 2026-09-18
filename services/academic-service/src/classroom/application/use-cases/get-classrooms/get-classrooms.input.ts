import { PaginationQueryInput } from '../../../../shared/domain/interfaces/repository.interface.js'

export interface GetClassroomsInput extends PaginationQueryInput {
  academicYearId?: string
  gradeId?: string
  search?: string
  isActive?: boolean
}
