import { Prisma } from '@prisma/client'

export const PROFILE_NAME_SELECT = {
  select: { name: true },
} satisfies Prisma.ProfileDefaultArgs

export const PROFILE_DISPLAY_SELECT = {
  select: {
    name: true,
    avatarFile: { select: { storageKey: true } },
  },
} satisfies Prisma.ProfileDefaultArgs

export const PROFILE_ROSTER_SELECT = {
  select: {
    name: true,
    gender: true,
    nik: true,
  },
} satisfies Prisma.ProfileDefaultArgs

const USER_REF_FIELDS = {
  id: true,
  identifier: true,
  isActive: true,
} satisfies Prisma.UserSelect

export const USER_REF_SELECT = {
  select: { ...USER_REF_FIELDS, profile: PROFILE_NAME_SELECT },
} satisfies Prisma.UserDefaultArgs

export const USER_DISPLAY_SELECT = {
  select: { ...USER_REF_FIELDS, profile: PROFILE_DISPLAY_SELECT },
} satisfies Prisma.UserDefaultArgs

export const USER_ROSTER_SELECT = {
  select: { ...USER_REF_FIELDS, profile: PROFILE_ROSTER_SELECT },
} satisfies Prisma.UserDefaultArgs

export const USER_ROLES_FOR_AUTHZ_SELECT = {
  select: {
    userId: true,
    roleId: true,
    role: {
      select: {
        id: true,
        code: true,
        name: true,
        rolePermissions: {
          select: { permission: { select: { code: true } } },
        },
      },
    },
  },
} satisfies Prisma.UserRoleDefaultArgs
