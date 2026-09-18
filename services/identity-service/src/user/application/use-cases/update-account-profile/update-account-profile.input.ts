import { UserGender } from '../../../../shared/domain/enums/user-gender.enum.js'

export interface UpdateAccountProfileInput {
  name?: string
  nik?: string
  gender?: UserGender
  birthPlace?: string
  birthDate?: string
  email?: string
  phone?: string
}
