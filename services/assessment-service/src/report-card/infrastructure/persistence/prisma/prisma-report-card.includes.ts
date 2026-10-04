import { Prisma } from '../../../../generated/prisma/client.js'

export const REPORT_CARD_WITH_DETAILS_INCLUDE = {
  subjects: { orderBy: { subjectName: 'asc' as const } },
} satisfies Prisma.ReportCardInclude

export type ReportCardRow = Prisma.ReportCardGetPayload<{
  include: typeof REPORT_CARD_WITH_DETAILS_INCLUDE
}>
