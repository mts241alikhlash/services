import { PaginationQueryInput } from '../../../../shared/domain/interfaces/repository.interface.js'

export interface GetEmployeesInput extends PaginationQueryInput {
  search?: string
  employmentTypeId?: string
  academicYearId?: string
  positionCategoryId?: string
  isActive?: boolean
}
