import { Prisma } from '../../../../../generated/prisma/client.js'
import {
  WithParentReferences,
  WithWaveAcademicYear,
} from './prisma-admission.refs.js'

export const applicationDetailInclude = {
  wave: true,
  parents: {
    orderBy: { relation: 'asc' as const },
  },
  achievements: {
    orderBy: { sortOrder: 'asc' as const },
    include: { file: true },
  },
  scholarships: {
    orderBy: { sortOrder: 'asc' as const },
    include: { file: true },
  },
  documents: {
    include: { documentType: true, file: true },
  },
  payment: {
    include: { proofFile: true, bankAccount: true },
  },
} satisfies Prisma.AdmissionApplicationInclude

type ApplicationRow = Prisma.AdmissionApplicationGetPayload<{
  include: typeof applicationDetailInclude
}>

export type ApplicationDetail = WithWaveAcademicYear<
  WithParentReferences<ApplicationRow>
>

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
