import { UserGender } from '../../../shared/domain/enums/user-gender.enum.js'

export interface ProfileSummaryEntity {
  userId: string
  identifier: string
  isActive: boolean
  name: string
  gender: UserGender
  nik: string
  avatarStorageKey: string | null
  birthPlace: string
  birthDate: Date
  email: string | null
  phone: string | null
}
