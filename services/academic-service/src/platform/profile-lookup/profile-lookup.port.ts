export interface ProfileSummary {
  userId: string
  identifier: string
  isActive: boolean
  name: string
  gender: 'MALE' | 'FEMALE'
  nik: string
  avatarStorageKey: string | null
}

export abstract class IProfileLookupPort {
  abstract findByUserIds(userIds: string[]): Promise<ProfileSummary[]>
}
