import { PaginationQueryInput } from '../../../../shared/domain/interfaces/repository.interface.js'

export interface GetStudentScoresInput extends PaginationQueryInput {
  enrollmentId?: string
  assessmentItemId?: string
  semesterId?: string
}
