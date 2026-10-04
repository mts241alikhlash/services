import { AssessmentType } from '../../../../shared/domain/enums/assessment-type.enum.js'

export interface AssessmentWeightRecordInput {
  type: AssessmentType
  weight: number
}

export interface ReplaceAssessmentWeightsInput {
  teachingAssignmentId: string
  weights: AssessmentWeightRecordInput[]
}
