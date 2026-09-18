import { Prisma } from '@prisma/client'

export const ASSESSMENT_ITEM_WITH_DETAILS_INCLUDE = {
  _count: {
    select: {
      studentScores: { where: { deletedAt: null } },
    },
  },
} satisfies Prisma.AssessmentItemInclude

export type AssessmentItemRow = Prisma.AssessmentItemGetPayload<{
  include: typeof ASSESSMENT_ITEM_WITH_DETAILS_INCLUDE
}>

export const STUDENT_SCORE_WITH_DETAILS_INCLUDE = {
  assessmentItem: true,
} satisfies Prisma.StudentScoreInclude

export type StudentScoreRow = Prisma.StudentScoreGetPayload<{
  include: typeof STUDENT_SCORE_WITH_DETAILS_INCLUDE
}>

export const REPORT_CARD_SCORE_INCLUDE = STUDENT_SCORE_WITH_DETAILS_INCLUDE

export type ReportCardScoreWithSubject = StudentScoreRow
