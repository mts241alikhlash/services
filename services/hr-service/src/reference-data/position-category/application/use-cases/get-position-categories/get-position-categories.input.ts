import { PaginationQueryInput } from '../../../../../shared/domain/interfaces/repository.interface.js'

export interface ListPositionCategoriesInput extends PaginationQueryInput {
  search?: string
}
