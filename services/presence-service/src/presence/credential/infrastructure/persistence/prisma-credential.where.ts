import { Prisma } from '@prisma/client'
import { CredentialQueryInput } from '../../domain/interfaces/credential-repository.interface.js'

export const NOT_DELETED = { deletedAt: null } as const

export function credentialWhere(
  query: CredentialQueryInput,
): Prisma.PresenceCredentialWhereInput {
  return {
    ...NOT_DELETED,
    ...(query.userId && { userId: query.userId }),
    ...(query.status && { status: query.status }),
    ...(query.subjectType && { subjectType: query.subjectType }),
  }
}

export function validOnDateWhere(
  userId: string,
  date: Date,
): Prisma.PresenceCredentialWhereInput {
  return {
    ...NOT_DELETED,
    userId,
    issuedAt: { lte: endOfDay(date) },
    OR: [{ revokedAt: null }, { revokedAt: { gte: startOfDay(date) } }],
  }
}

function startOfDay(date: Date): Date {
  const start = new Date(date)
  start.setUTCHours(0, 0, 0, 0)
  return start
}

function endOfDay(date: Date): Date {
  const end = new Date(date)
  end.setUTCHours(23, 59, 59, 999)
  return end
}
