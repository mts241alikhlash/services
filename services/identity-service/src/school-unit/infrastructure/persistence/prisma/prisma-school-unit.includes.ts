import { Prisma } from '../../../../generated/prisma/client.js'

export const SCHOOL_UNIT_INCLUDE = {
  socialMedias: { include: { socialMedia: true } },
  type: true,
} satisfies Prisma.SchoolUnitInclude

export type SchoolUnitWithDetails = Prisma.SchoolUnitGetPayload<{
  include: typeof SCHOOL_UNIT_INCLUDE
}>
