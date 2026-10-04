import { AssessmentType } from '../../../shared/domain/enums/assessment-type.enum.js'

export interface AssessmentWeightEntity {
  type: AssessmentType
  weight: number
  id?: string
  teachingAssignmentId?: string
}
