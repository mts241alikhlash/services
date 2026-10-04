import { PaginationQueryInput } from '../../../../shared/domain/interfaces/repository.interface.js'

export interface GetCurriculumSubjectsInput extends PaginationQueryInput {
  curriculumId?: string
  subjectId?: string
}
