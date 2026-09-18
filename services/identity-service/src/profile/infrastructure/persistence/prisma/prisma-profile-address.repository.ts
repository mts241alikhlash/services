import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import {
  AddressesForUser,
  CreateProfileAddressRepositoryInput,
  IProfileAddressRepository,
  ProfileAddressEntity,
  UpdateProfileAddressRepositoryInput,
} from '../../../domain/repositories/profile-address.repository.js'

const ADDRESS_SELECT = {
  id: true,
  street: true,
  rt: true,
  rw: true,
  village: true,
  district: true,
  city: true,
  province: true,
  country: true,
  postalCode: true,
  isPrimary: true,
  latitude: true,
  longitude: true,
} satisfies Prisma.AddressSelect

@Injectable()
export class PrismaProfileAddressRepository extends IProfileAddressRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findProfileIdByUserId(userId: string): Promise<string | null> {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { id: true },
    })
    return profile?.id ?? null
  }

  async findAllByProfileId(profileId: string): Promise<ProfileAddressEntity[]> {
    return this.prisma.address.findMany({
      where: { profileId, deletedAt: null },
      select: ADDRESS_SELECT,
      orderBy: [{ isPrimary: 'desc' }, { id: 'asc' }],
    })
  }

  async findByIdForProfile(
    addressId: string,
    profileId: string,
  ): Promise<ProfileAddressEntity | null> {
    return this.prisma.address.findFirst({
      where: { id: addressId, profileId, deletedAt: null },
      select: ADDRESS_SELECT,
    })
  }

  async findByUserIds(userIds: string[]): Promise<AddressesForUser[]> {
    if (userIds.length === 0) return []

    const profiles = await this.prisma.profile.findMany({
      where: { userId: { in: userIds } },
      select: {
        userId: true,
        addresses: {
          where: { deletedAt: null },
          select: ADDRESS_SELECT,
          orderBy: [{ isPrimary: 'desc' }, { id: 'asc' }],
        },
      },
    })

    return profiles.map((profile) => ({
      userId: profile.userId,
      addresses: profile.addresses,
    }))
  }

  async create(
    profileId: string,
    input: CreateProfileAddressRepositoryInput,
  ): Promise<ProfileAddressEntity> {
    return this.prisma.address.create({
      data: { ...input, profileId },
      select: ADDRESS_SELECT,
    })
  }

  async update(
    addressId: string,
    input: UpdateProfileAddressRepositoryInput,
  ): Promise<ProfileAddressEntity> {
    return this.prisma.address.update({
      where: { id: addressId },
      data: input,
      select: ADDRESS_SELECT,
    })
  }

  async softDelete(addressId: string): Promise<ProfileAddressEntity> {
    return this.prisma.address.update({
      where: { id: addressId },
      data: { deletedAt: new Date() },
      select: ADDRESS_SELECT,
    })
  }

  async clearPrimary(profileId: string, exceptId?: string): Promise<number> {
    const { count } = await this.prisma.address.updateMany({
      where: {
        profileId,
        deletedAt: null,
        isPrimary: true,
        ...(exceptId !== undefined && { id: { not: exceptId } }),
      },
      data: { isPrimary: false },
    })
    return count
  }
}
