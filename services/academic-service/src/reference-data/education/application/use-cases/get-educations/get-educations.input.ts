import { PaginationQueryInput } from '../../../../../shared/domain/interfaces/repository.interface.js'

export interface ListEducationsInput extends PaginationQueryInput {
  search?: string
  isActive?: boolean
}
