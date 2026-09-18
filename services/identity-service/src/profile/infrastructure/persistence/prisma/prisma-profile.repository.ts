import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import { MaritalStatus } from '../../../../shared/domain/enums/marital-status.enum.js'
import { UserGender } from '../../../../shared/domain/enums/user-gender.enum.js'
import {
  CreateAvatarFileInput,
  IProfileRepository,
  ProfileWithReferences,
  UpdateProfileRepositoryInput,
} from '../../../domain/repositories/profile.repository.js'

const PROFILE_SELECT = {
  id: true,
  userId: true,
  name: true,
  nik: true,
  gender: true,
  birthPlace: true,
  birthDate: true,
  email: true,
  phone: true,
  maritalStatus: true,
  noKk: true,
  npwp: true,
  religion: { select: { id: true, name: true } },
  bloodType: { select: { id: true, name: true } },
  avatarFile: {
    select: {
      id: true,
      filename: true,
      originalName: true,
      mimeType: true,
      sizeBytes: true,
      storageKey: true,
    },
  },
  user: { select: { identifier: true, isActive: true } },
} satisfies Prisma.ProfileSelect

type ProfileRow = Prisma.ProfileGetPayload<{ select: typeof PROFILE_SELECT }>

function toProfile(row: ProfileRow): ProfileWithReferences {
  const { user, gender, maritalStatus, ...profile } = row
  return {
    ...profile,
    gender: gender as UserGender,
    maritalStatus: maritalStatus as MaritalStatus | null,
    identifier: user.identifier,
    isActive: user.isActive,
  }
}

@Injectable()
export class PrismaProfileRepository extends IProfileRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findByUserId(userId: string): Promise<ProfileWithReferences | null> {
    const row = await this.prisma.profile.findUnique({
      where: { userId },
      select: PROFILE_SELECT,
    })
    return row ? toProfile(row) : null
  }

  async findByNik(nik: string, excludeUserId: string) {
    return this.prisma.profile.findFirst({
      where: { nik, userId: { not: excludeUserId } },
      select: { userId: true },
    })
  }

  async findByEmail(email: string, excludeUserId: string) {
    return this.prisma.profile.findFirst({
      where: { email, userId: { not: excludeUserId } },
      select: { userId: true },
    })
  }

  async findByPhone(phone: string, excludeUserId: string) {
    return this.prisma.profile.findFirst({
      where: { phone, userId: { not: excludeUserId } },
      select: { userId: true },
    })
  }

  async referenceExists(
    kind: 'religion' | 'bloodType',
    id: string,
  ): Promise<boolean> {
    const found =
      kind === 'religion'
        ? await this.prisma.religion.findFirst({
            where: { id, deletedAt: null },
            select: { id: true },
          })
        : await this.prisma.bloodType.findFirst({
            where: { id, deletedAt: null },
            select: { id: true },
          })
    return found !== null
  }

  async update(
    userId: string,
    input: UpdateProfileRepositoryInput,
  ): Promise<ProfileWithReferences> {
    const row = await this.prisma.profile.update({
      where: { userId },
      data: input,
      select: PROFILE_SELECT,
    })
    return toProfile(row)
  }

  async setAvatar(
    userId: string,
    file: CreateAvatarFileInput,
  ): Promise<{
    profile: ProfileWithReferences
    replacedKey: string | null
  }> {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.profile.findUniqueOrThrow({
        where: { userId },
        select: {
          avatarFileId: true,
          avatarFile: { select: { storageKey: true } },
        },
      })

      const created = await tx.file.create({
        data: {
          uploadedBy: file.uploadedBy,
          filename: file.filename,
          originalName: file.originalName,
          mimeType: file.mimeType,
          sizeBytes: file.sizeBytes,
          storageKey: file.storageKey,
        },
        select: { id: true },
      })

      const row = await tx.profile.update({
        where: { userId },
        data: { avatarFileId: created.id },
        select: PROFILE_SELECT,
      })

      if (current.avatarFileId) {
        await tx.file.update({
          where: { id: current.avatarFileId },
          data: { deletedAt: new Date() },
        })
      }

      return {
        profile: toProfile(row),
        replacedKey: current.avatarFile?.storageKey ?? null,
      }
    })
  }

  async clearAvatar(userId: string): Promise<{
    profile: ProfileWithReferences
    replacedKey: string | null
  }> {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.profile.findUniqueOrThrow({
        where: { userId },
        select: {
          avatarFileId: true,
          avatarFile: { select: { storageKey: true } },
        },
      })

      const row = await tx.profile.update({
        where: { userId },
        data: { avatarFileId: null },
        select: PROFILE_SELECT,
      })

      if (current.avatarFileId) {
        await tx.file.update({
          where: { id: current.avatarFileId },
          data: { deletedAt: new Date() },
        })
      }

      return {
        profile: toProfile(row),
        replacedKey: current.avatarFile?.storageKey ?? null,
      }
    })
  }
}
