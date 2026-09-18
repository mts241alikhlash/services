import { UserGender } from '../../../../shared/domain/enums/user-gender.enum.js'

export interface ProvisionAccountProfileInput {
  name: string
  nik: string
  gender: UserGender
  birthPlace: string
  birthDate: Date
  email?: string
  phone?: string
}

export interface ProvisionAccountInput {
  identifier: string
  passwordHash: string
  roleCode?: string
  profile?: ProvisionAccountProfileInput
}

export interface ProvisionedAccount {
  id: string
}

export interface UpdateAccountProfileInput {
  name?: string
  nik?: string
  gender?: UserGender
  birthPlace?: string
  birthDate?: Date
  email?: string
  phone?: string
}

export interface AccountProfile {
  id: string
  userId: string
  name: string
  nik: string
  gender: UserGender
  birthPlace: string
  birthDate: Date
  email: string | null
  phone: string | null
}

export interface AccountLookupInput {
  identifier?: string
  nik?: string
}

export interface AccountLookupResult {
  identifierTaken: boolean
  nikOwnerId: string | null
}

export interface AccountRecord {
  id: string
  identifier: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export abstract class IAccountProvisioningPort {
  abstract provision(input: ProvisionAccountInput): Promise<ProvisionedAccount>
  abstract deprovision(userId: string): Promise<void>
  abstract setActive(userId: string, isActive: boolean): Promise<AccountRecord>
  abstract updateProfile(
    userId: string,
    data: UpdateAccountProfileInput,
  ): Promise<AccountProfile>
  abstract lookup(input: AccountLookupInput): Promise<AccountLookupResult>
}
