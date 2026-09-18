import { PaginationQueryInput } from '../../../../../shared/domain/interfaces/repository.interface.js'

export interface ListPositionsInput extends PaginationQueryInput {
  search?: string
  categoryId?: string
  isActive?: boolean
}
