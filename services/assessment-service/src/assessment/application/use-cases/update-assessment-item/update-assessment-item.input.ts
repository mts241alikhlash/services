import { AssessmentType } from '../../../../shared/domain/enums/assessment-type.enum.js'

export interface UpdateAssessmentItemInput {
  name?: string
  type?: AssessmentType
  weight?: number
  maxScore?: number
}
