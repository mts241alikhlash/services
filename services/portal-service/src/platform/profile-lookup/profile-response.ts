import { ServiceUnavailableException } from '@nestjs/common'
import { z } from 'zod'
import type { ProfileSummary } from './profile-lookup.port.js'

const profileResponse = z.object({
  data: z.array(
    z.object({
      userId: z.string().min(1),
      identifier: z.string(),
      name: z.string(),
    }),
  ),
})

export function parseProfiles(
  body: unknown,
  requestedIds: string[],
): ProfileSummary[] {
  const parsed = profileResponse.safeParse(body)
  if (!parsed.success) {
    throw new ServiceUnavailableException(
      'The identity service returned invalid profiles.',
    )
  }
  const requested = new Set(requestedIds)
  const seen = new Set<string>()
  for (const profile of parsed.data.data) {
    if (!requested.has(profile.userId) || seen.has(profile.userId)) {
      throw new ServiceUnavailableException(
        'The identity service returned unexpected profiles.',
      )
    }
    seen.add(profile.userId)
  }
  return parsed.data.data
}
