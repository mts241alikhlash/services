import { AssessmentType } from '../../../../shared/domain/enums/assessment-type.enum.js'
import { PaginationQueryInput } from '../../../../shared/domain/interfaces/repository.interface.js'

export interface GetAssessmentItemsInput extends PaginationQueryInput {
  type?: AssessmentType
  teachingAssignmentId?: string
}
