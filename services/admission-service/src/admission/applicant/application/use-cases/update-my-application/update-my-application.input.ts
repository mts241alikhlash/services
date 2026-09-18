import type {
  AdmissionApplicationParentInput,
  UpdateMyApplicationFields,
} from '../../../domain/repositories/admission-applicant-repository.js'

export type UpdateMyApplicationInput = UpdateMyApplicationFields & {
  parents?: AdmissionApplicationParentInput[]
}
