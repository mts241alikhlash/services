export interface ProfileAddressEntity {
  id: string
  street: string
  rt: string
  rw: string
  village: string
  district: string
  city: string
  province: string
  country: string
  postalCode: string
  isPrimary: boolean
  latitude: number | null
  longitude: number | null
}

export interface AddressesForUser {
  userId: string
  addresses: ProfileAddressEntity[]
}

export interface CreateProfileAddressRepositoryInput {
  street: string
  rt: string
  rw: string
  village: string
  district: string
  city: string
  province: string
  country?: string
  postalCode: string
  isPrimary?: boolean
  latitude?: number | null
  longitude?: number | null
}

export type UpdateProfileAddressRepositoryInput =
  Partial<CreateProfileAddressRepositoryInput>

export abstract class IProfileAddressRepository {
  abstract findProfileIdByUserId(userId: string): Promise<string | null>
  abstract findAllByProfileId(
    profileId: string,
  ): Promise<ProfileAddressEntity[]>
  abstract findByIdForProfile(
    addressId: string,
    profileId: string,
  ): Promise<ProfileAddressEntity | null>
  abstract findByUserIds(userIds: string[]): Promise<AddressesForUser[]>
  abstract create(
    profileId: string,
    input: CreateProfileAddressRepositoryInput,
  ): Promise<ProfileAddressEntity>
  abstract update(
    addressId: string,
    input: UpdateProfileAddressRepositoryInput,
  ): Promise<ProfileAddressEntity>
  abstract softDelete(addressId: string): Promise<ProfileAddressEntity>
  abstract clearPrimary(profileId: string, exceptId?: string): Promise<number>
}
