import { UserGender } from '../../../../shared/domain/enums/user-gender.enum.js'

export interface UpdateStudentProfileInput {
  name?: string
  nik?: string
  gender?: `${UserGender}`
  birthPlace?: string
  birthDate?: string | Date
  religionId?: string | null
  email?: string | null
  phone?: string | null
  photo?: string | null
  bloodTypeId?: string | null
}
