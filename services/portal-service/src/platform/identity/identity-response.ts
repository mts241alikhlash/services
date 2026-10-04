import { ServiceUnavailableException } from '@nestjs/common'
import { z } from 'zod'
import type { Identity } from './identity.port.js'

const identityResponse = z.object({
  data: z.discriminatedUnion('active', [
    z.object({ active: z.literal(false) }),
    z.object({
      active: z.literal(true),
      userId: z.string().min(1),
      identifier: z.string(),
      sessionId: z.string().min(1),
      roles: z.array(z.string()),
      permissions: z.array(z.string()),
    }),
  ]),
})

export function parseIdentityResponse(body: unknown): Identity | null {
  const result = identityResponse.safeParse(body)
  if (!result.success) {
    throw new ServiceUnavailableException(
      'The identity service returned an invalid response.',
    )
  }
  if (!result.data.data.active) return null
  const { userId, identifier, sessionId, roles, permissions } = result.data.data
  return { userId, identifier, sessionId, roles, permissions }
}
