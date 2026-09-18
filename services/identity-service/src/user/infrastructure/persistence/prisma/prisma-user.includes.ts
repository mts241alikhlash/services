import { Prisma } from '@prisma/client'

export const PUBLIC_USER_SELECT = {
  id: true,
  identifier: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect
