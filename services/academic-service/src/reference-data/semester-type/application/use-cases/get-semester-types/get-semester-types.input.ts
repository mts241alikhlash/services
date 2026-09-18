import { PaginationQueryInput } from '../../../../../shared/domain/interfaces/repository.interface.js'

export interface ListSemesterTypesInput extends PaginationQueryInput {
  search?: string
  isActive?: boolean
}
