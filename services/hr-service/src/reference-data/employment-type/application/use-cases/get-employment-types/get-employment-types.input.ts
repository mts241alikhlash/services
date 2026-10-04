import { PaginationQueryInput } from '../../../../../shared/domain/interfaces/repository.interface.js'

export interface ListEmploymentTypesInput extends PaginationQueryInput {
  search?: string
}
