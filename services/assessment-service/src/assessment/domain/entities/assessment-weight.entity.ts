import { AssessmentType } from '@prisma/client'

export interface AssessmentWeightEntity {
  type: AssessmentType
  weight: number
}
