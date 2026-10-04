export interface ProfileSummary {
  userId: string
  identifier: string
  isActive: boolean
  name: string
  gender: 'MALE' | 'FEMALE'
  nik: string
  avatarStorageKey: string | null
  birthPlace: string
  birthDate: string
  email: string | null
  phone: string | null
}

export abstract class IProfileLookupPort {
  abstract findByUserIds(userIds: string[]): Promise<ProfileSummary[]>
}
