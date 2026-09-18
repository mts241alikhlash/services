import {
  IProfileLookupPort,
  ProfileSummary,
} from '../../platform/profile-lookup/profile-lookup.port.js'
import {
  ProfileRosterRef,
  UserRef,
} from '../domain/entities/reference.entity.js'

function toUserRef(profile: ProfileSummary): UserRef<ProfileRosterRef> {
  return {
    id: profile.userId,
    identifier: profile.identifier,
    isActive: profile.isActive,
    profile: {
      name: profile.name,
      gender: profile.gender,
      nik: profile.nik,
    },
  }
}

export async function resolveUserRefs(
  userIds: string[],
  profileLookupPort: IProfileLookupPort,
): Promise<Map<string, UserRef<ProfileRosterRef>>> {
  if (userIds.length === 0) return new Map()

  const profiles = await profileLookupPort.findByUserIds([...new Set(userIds)])
  return new Map(
    profiles.map((profile) => [profile.userId, toUserRef(profile)]),
  )
}
