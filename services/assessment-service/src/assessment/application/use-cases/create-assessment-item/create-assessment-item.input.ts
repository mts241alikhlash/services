import { AssessmentType } from '../../../../shared/domain/enums/assessment-type.enum.js'

export interface CreateAssessmentItemInput {
  teachingAssignmentId: string
  name: string
  type: AssessmentType
  weight?: number
  maxScore?: number
}
