import { MaritalStatus } from '../../../../shared/domain/enums/marital-status.enum.js'
import { UserGender } from '../../../../shared/domain/enums/user-gender.enum.js'

export interface UpdateProfileInput {
  name?: string
  nik?: string
  gender?: UserGender
  birthPlace?: string
  birthDate?: string
  email?: string
  phone?: string
  religionId?: string
  bloodTypeId?: string
  maritalStatus?: MaritalStatus
  noKk?: string
  npwp?: string
}
