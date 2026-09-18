import { PaginationQueryInput } from '../../../../../shared/domain/interfaces/repository.interface.js'

export interface ListOccupationsInput extends PaginationQueryInput {
  search?: string
  isActive?: boolean
}
