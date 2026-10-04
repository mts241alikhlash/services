import type {
  AdmissionAchievementInput,
  AdmissionApplicationParentInput,
  AdmissionScholarshipInput,
  UpdateMyApplicationFields,
} from '../../../domain/repositories/admission-applicant-repository.js'

export type UpdateMyApplicationInput = UpdateMyApplicationFields & {
  parents?: AdmissionApplicationParentInput[]
  achievements?: AdmissionAchievementInput[]
  scholarships?: AdmissionScholarshipInput[]
}
