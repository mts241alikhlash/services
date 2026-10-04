import { Injectable, NotFoundException } from '@nestjs/common'
import {
  CreateProfileAddressRepositoryInput,
  IProfileAddressRepository,
  ProfileAddressEntity,
  UpdateProfileAddressRepositoryInput,
} from '../../domain/repositories/profile-address.repository.js'

@Injectable()
export class ProfileAddressService {
  constructor(private readonly addresses: IProfileAddressRepository) {}

  async list(userId: string): Promise<ProfileAddressEntity[]> {
    const profileId = await this.profileIdOf(userId)
    return this.addresses.findAllByProfileId(profileId)
  }

  async add(
    userId: string,
    input: CreateProfileAddressRepositoryInput,
  ): Promise<ProfileAddressEntity> {
    const profileId = await this.profileIdOf(userId)

    if (input.isPrimary) {
      await this.addresses.clearPrimary(profileId)
    }

    return this.addresses.create(profileId, input)
  }

  async update(
    userId: string,
    addressId: string,
    input: UpdateProfileAddressRepositoryInput,
  ): Promise<ProfileAddressEntity> {
    const profileId = await this.profileIdOf(userId)
    await this.ownedOrFail(addressId, profileId)

    if (input.isPrimary) {
      await this.addresses.clearPrimary(profileId, addressId)
    }

    return this.addresses.update(addressId, input)
  }

  async remove(userId: string, addressId: string): Promise<void> {
    const profileId = await this.profileIdOf(userId)
    await this.ownedOrFail(addressId, profileId)
    await this.addresses.softDelete(addressId)
  }

  private async profileIdOf(userId: string): Promise<string> {
    const profileId = await this.addresses.findProfileIdByUserId(userId)
    if (!profileId) {
      throw new NotFoundException(`Profile for user ID ${userId} not found`)
    }
    return profileId
  }

  private async ownedOrFail(addressId: string, profileId: string) {
    const address = await this.addresses.findByIdForProfile(
      addressId,
      profileId,
    )
    if (!address) {
      throw new NotFoundException(`Address ${addressId} not found`)
    }
    return address
  }
}
