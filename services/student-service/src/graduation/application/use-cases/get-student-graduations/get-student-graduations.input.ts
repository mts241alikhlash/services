import { PaginationQueryInput } from '../../../../shared/domain/interfaces/repository.interface.js'

export interface GetStudentGraduationsInput extends PaginationQueryInput {
  academicYearId?: string
  search?: string
}
