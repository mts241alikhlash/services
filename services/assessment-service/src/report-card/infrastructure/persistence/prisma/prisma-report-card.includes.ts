import { Prisma } from '@prisma/client'

export const REPORT_CARD_WITH_DETAILS_INCLUDE = {
  subjects: { orderBy: { subjectName: 'asc' as const } },
} satisfies Prisma.ReportCardInclude

export type ReportCardRow = Prisma.ReportCardGetPayload<{
  include: typeof REPORT_CARD_WITH_DETAILS_INCLUDE
}>
