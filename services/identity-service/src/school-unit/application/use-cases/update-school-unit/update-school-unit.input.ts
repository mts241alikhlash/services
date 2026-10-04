import { SchoolUnitStatus } from '../../../../shared/domain/enums/school-unit-status.enum.js'

export interface UpdateSchoolUnitInput {
  name?: string
  surname?: string
  nsm?: string
  npsn?: string
  status?: SchoolUnitStatus
  typeId?: string
  npwp?: string
  phone?: string
  email?: string
  website?: string
}
