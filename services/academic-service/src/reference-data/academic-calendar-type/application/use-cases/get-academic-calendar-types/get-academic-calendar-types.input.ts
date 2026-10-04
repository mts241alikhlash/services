import { PaginationQueryInput } from '../../../../../shared/domain/interfaces/repository.interface.js'

export interface ListAcademicCalendarTypesInput extends PaginationQueryInput {
  search?: string
  isActive?: boolean
}
