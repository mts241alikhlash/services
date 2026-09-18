export interface SetAddressInput {
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

export type UpdateAddressInput = Partial<SetAddressInput>
