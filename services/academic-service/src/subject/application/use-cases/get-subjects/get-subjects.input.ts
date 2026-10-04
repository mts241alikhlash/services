import { PaginationQueryInput } from '../../../../shared/domain/interfaces/repository.interface.js'

export interface GetSubjectsInput extends PaginationQueryInput {
  search?: string
}
