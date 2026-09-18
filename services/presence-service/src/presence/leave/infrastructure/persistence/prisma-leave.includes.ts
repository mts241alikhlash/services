import { Prisma } from '@prisma/client'
import { ProfileSummary } from '../../../../platform/profile-lookup/profile-lookup.port.js'
import { LeaveRequestWithDetails } from '../../domain/entities/leave.entity.js'

export const REQUEST_INCLUDE = {
  leaveType: {
    select: { id: true, code: true, name: true, treatment: true },
  },
  days: { select: { date: true }, orderBy: { date: 'asc' } },
} satisfies Prisma.LeaveRequestInclude

export type RequestRow = Prisma.LeaveRequestGetPayload<{
  include: typeof REQUEST_INCLUDE
}>

export function toDetails(
  row: RequestRow,
  profileByUserId: Map<string, ProfileSummary>,
): LeaveRequestWithDetails {
  const { leaveType, days, ...request } = row

  return {
    ...request,
    requester: {
      id: request.requesterId,
      displayName: profileByUserId.get(request.requesterId)?.name ?? null,
    },
    approver: request.approverId
      ? {
          id: request.approverId,
          displayName: profileByUserId.get(request.approverId)?.name ?? null,
        }
      : null,
    leaveType,
    days: days.map((day) => day.date),
  }
}
