import { PaginationQueryInput } from '../../../../shared/domain/interfaces/repository.interface.js'

export interface GetCurriculaInput extends PaginationQueryInput {
  search?: string
  academicYearId?: string
  isActive?: boolean
}
