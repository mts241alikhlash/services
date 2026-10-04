export interface ProfileSummary {
  userId: string
  identifier: string
  name: string
}

export abstract class IProfileLookupPort {
  abstract findByUserIds(userIds: string[]): Promise<ProfileSummary[]>
}
