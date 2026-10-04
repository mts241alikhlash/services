import { PaginationQueryInput } from '../../../../shared/domain/interfaces/repository.interface.js'

export interface ListParentsInput extends PaginationQueryInput {
  search?: string
  occupationId?: string
}
