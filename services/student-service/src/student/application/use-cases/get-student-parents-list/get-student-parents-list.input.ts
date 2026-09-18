import { PaginationQueryInput } from '../../../../shared/domain/interfaces/repository.interface.js'

export interface StudentParentQueryInput extends PaginationQueryInput {
  studentId?: string
}
