import { PaginationQueryInput } from '../../../../shared/domain/interfaces/repository.interface.js'

export interface GetGradesInput extends PaginationQueryInput {
  search?: string
  isActive?: boolean
}
