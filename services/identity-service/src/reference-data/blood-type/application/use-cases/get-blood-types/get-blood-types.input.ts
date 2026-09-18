import { PaginationQueryInput } from '../../../../../shared/domain/interfaces/repository.interface.js'

export interface ListBloodTypesInput extends PaginationQueryInput {
  search?: string
  isActive?: boolean
}
