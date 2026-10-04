import { AssessmentWeightEntity } from '../entities/assessment-weight.entity.js'

export type { AssessmentWeightEntity }

export interface ReplaceAssessmentWeightsInput {
  teachingAssignmentId: string
  weights: AssessmentWeightEntity[]
}

export abstract class IAssessmentWeightRepository {
  abstract findByTeachingAssignment(
    teachingAssignmentId: string,
  ): Promise<AssessmentWeightEntity[]>

  abstract replaceForTeachingAssignment(
    input: ReplaceAssessmentWeightsInput,
  ): Promise<AssessmentWeightEntity[]>
}
