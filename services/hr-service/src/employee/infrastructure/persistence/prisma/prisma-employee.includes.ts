import { Prisma } from '@prisma/client'

export const EMPLOYEE_LIST_INCLUDE = {
  employmentType: true,
  positions: {
    where: { isPrimary: true },
    include: { position: { include: { category: true } } },
  },
} satisfies Prisma.EmployeeInclude

export const EMPLOYEE_EXPORT_INCLUDE = {
  employmentType: true,
  positions: {
    where: { isPrimary: true },
    include: { position: { include: { category: true } } },
  },
} satisfies Prisma.EmployeeInclude

export const EMPLOYEE_DETAIL_INCLUDE = {
  employmentType: true,
  positions: {
    include: { position: { include: { category: true } } },
    orderBy: [{ isPrimary: 'desc' as const }, { hireDate: 'desc' as const }],
  },
} satisfies Prisma.EmployeeInclude

export const EMPLOYEE_POSITION_INCLUDE = {
  position: { include: { category: true } },
} satisfies Prisma.EmployeePositionInclude

export type EmployeeRow = Prisma.EmployeeGetPayload<{
  include: typeof EMPLOYEE_DETAIL_INCLUDE
}>

export type EmployeeListRow = Prisma.EmployeeGetPayload<{
  include: typeof EMPLOYEE_LIST_INCLUDE
}>

export type EmployeeExportRow = Prisma.EmployeeGetPayload<{
  include: typeof EMPLOYEE_EXPORT_INCLUDE
}>

export type EmployeePositionWithDetails = Prisma.EmployeePositionGetPayload<{
  include: typeof EMPLOYEE_POSITION_INCLUDE
}>
