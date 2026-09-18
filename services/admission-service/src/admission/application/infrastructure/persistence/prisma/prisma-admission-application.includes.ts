import { Prisma } from '@prisma/client'
import { WithParentReferences } from './prisma-admission.refs.js'

export const applicationDetailInclude = {
  wave: true,
  parents: {
    orderBy: { relation: 'asc' as const },
  },
  documents: {
    include: { documentType: true, file: true },
  },
  payment: {
    include: { proofFile: true },
  },
} satisfies Prisma.AdmissionApplicationInclude

type ApplicationRow = Prisma.AdmissionApplicationGetPayload<{
  include: typeof applicationDetailInclude
}>

export type ApplicationDetail = WithParentReferences<ApplicationRow>

export const applicationAdminDetailInclude =
  applicationDetailInclude satisfies Prisma.AdmissionApplicationInclude

type ApplicationAdminRow = Prisma.AdmissionApplicationGetPayload<{
  include: typeof applicationAdminDetailInclude
}>

export type ApplicationAdminDetail =
  WithParentReferences<ApplicationAdminRow> & {
    religion: { id: string; name: string } | null
  }

export const applicationListInclude = {
  wave: { select: { id: true, name: true, code: true } },
  payment: { select: { status: true } },
  _count: { select: { documents: true } },
} satisfies Prisma.AdmissionApplicationInclude

export type ApplicationListItem = Prisma.AdmissionApplicationGetPayload<{
  include: typeof applicationListInclude
}>
