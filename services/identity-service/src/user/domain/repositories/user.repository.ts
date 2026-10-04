import {
  PaginatedResult,
  PaginationQueryInput,
} from '../../../shared/domain/interfaces/repository.interface.js'
import { UserEntity } from '../../../shared/domain/entities/user.entity.js'
import { UserGender } from '../../../shared/domain/enums/user-gender.enum.js'
import { UserPublic } from '../entities/user.entity.js'
import { ProfileSummaryEntity } from '../entities/profile-summary.entity.js'

export type { UserPublic, ProfileSummaryEntity }

export interface UserQueryInput extends PaginationQueryInput {
  roleCode?: string
  search?: string
}

export interface CreateUserRepositoryInput {
  identifier: string
  passwordHash: string
}

export interface UpdateUserRepositoryInput {
  identifier?: string
  passwordHash?: string
  isActive?: boolean
}

export interface ProvisionAccountAddressRepositoryInput {
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

export interface ProvisionAccountProfileRepositoryInput {
  name: string
  nik: string
  gender: UserGender
  birthPlace: string
  birthDate: Date
  email?: string
  phone?: string
  address?: ProvisionAccountAddressRepositoryInput
}

export interface ProvisionAccountRepositoryInput {
  identifier: string
  passwordHash: string
  roleCode?: string
  profile?: ProvisionAccountProfileRepositoryInput
}

export interface ProvisionedAccount {
  id: string
}

export interface UpdateProfileRepositoryInput {
  name?: string
  nik?: string
  gender?: UserGender
  birthPlace?: string
  birthDate?: Date
  email?: string
  phone?: string
}

export interface ProfileRecord {
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

export interface UserSummary {
  total: number
  active: number
  inactive: number
}

export abstract class IUserRepository {
  abstract summarise(): Promise<UserSummary>
  abstract findAll(query: UserQueryInput): Promise<PaginatedResult<UserPublic>>

  abstract findById(id: string): Promise<UserPublic | null>
  abstract findByIdWithPassword(id: string): Promise<UserEntity | null>
  abstract findByIdentifier(identifier: string): Promise<UserPublic | null>
  abstract findByIdentifierWithPassword(
    identifier: string,
  ): Promise<UserEntity | null>
  abstract existsByIdentifier(identifier: string): Promise<boolean>
  abstract existsById(id: string): Promise<boolean>

  abstract create(data: CreateUserRepositoryInput): Promise<UserPublic>
  abstract update(
    id: string,
    data: UpdateUserRepositoryInput,
  ): Promise<UserPublic>
  abstract remove(id: string): Promise<UserPublic>

  abstract provisionAccount(
    input: ProvisionAccountRepositoryInput,
  ): Promise<ProvisionedAccount>

  abstract findProfilesByUserIds(
    userIds: string[],
  ): Promise<ProfileSummaryEntity[]>

  abstract updateProfile(
    userId: string,
    data: UpdateProfileRepositoryInput,
  ): Promise<ProfileRecord>

  abstract lookupAccount(
    input: AccountLookupInput,
  ): Promise<AccountLookupResult>

  abstract assignRole(userId: string, roleCode: string): Promise<void>
}
