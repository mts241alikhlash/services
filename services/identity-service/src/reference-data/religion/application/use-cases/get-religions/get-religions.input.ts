import { PaginationQueryInput } from '../../../../../shared/domain/interfaces/repository.interface.js'

export interface ListReligionsInput extends PaginationQueryInput {
  search?: string
  isActive?: boolean
}
