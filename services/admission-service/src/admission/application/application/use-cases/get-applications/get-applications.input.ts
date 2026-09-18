import type { AdmissionStatus } from '../../../../../shared/domain/enums/admission-status.enum.js'

export interface GetApplicationsInput {
  page?: number
  limit?: number
  search?: string
  status?: AdmissionStatus
  waveId?: string
}
