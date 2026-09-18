import { ProfileSummary } from '../../../../platform/profile-lookup/profile-lookup.port.js'
import { CredentialHolderRef } from '../../domain/entities/credential.entity.js'

export function toHolderRef(
  userId: string,
  profile: ProfileSummary | undefined,
): CredentialHolderRef {
  return {
    id: userId,
    identifier: profile?.identifier ?? '',
    displayName: profile?.name ?? null,
    photoUrl: profile?.avatarStorageKey
      ? `/files/${profile.avatarStorageKey}`
      : null,
  }
}
