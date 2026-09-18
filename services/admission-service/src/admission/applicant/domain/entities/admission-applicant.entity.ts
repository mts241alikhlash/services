import { AdmissionStatus } from '../../../../shared/domain/enums/admission-status.enum.js'

export interface AdmissionApplicantEntity {
  id: string
  userId: string
  registrationNumber: string
  status: `${AdmissionStatus}`
  deletedAt?: Date | null
}
