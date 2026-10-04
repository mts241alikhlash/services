import { Prisma } from '../../../../generated/prisma/client.js'

export const STUDENT_PARENT_INCLUDE = {
  parent: true,
} satisfies Prisma.StudentParentInclude

export type StudentParentRow = Prisma.StudentParentGetPayload<{
  include: typeof STUDENT_PARENT_INCLUDE
}>

export type StudentParentWithDetails = Omit<StudentParentRow, 'parent'> & {
  parent: StudentParentRow['parent'] & {
    occupation: { id: string; name: string } | null
    education: { id: string; name: string } | null
  }
}
