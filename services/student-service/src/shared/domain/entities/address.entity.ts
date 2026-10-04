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
}

export type UpdateAddressRepositoryInput = Partial<CreateAddressRepositoryInput>
