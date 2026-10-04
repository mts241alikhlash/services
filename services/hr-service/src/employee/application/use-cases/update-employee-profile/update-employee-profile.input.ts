import { UserGender } from '../../../../shared/domain/enums/user-gender.enum.js'

export interface UpdateEmployeeProfileInput {
  name?: string
  nik?: string
  gender?: UserGender
  birthPlace?: string
  birthDate?: string | Date
  email?: string | null
  phone?: string | null
  religion?: string | null
  nationality?: string | null
}
