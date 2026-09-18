export interface AddressEntity {
  id: string
  schoolUnitId?: string | null
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
  latitude?: number | null
  longitude?: number | null
  deletedAt?: Date | null
}

export interface CreateAddressRepositoryInput {
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

export type UpdateAddressRepositoryInput = Partial<CreateAddressRepositoryInput>
