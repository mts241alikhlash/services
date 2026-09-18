import { MaritalStatus } from '../../../shared/domain/enums/marital-status.enum.js'
import { UserGender } from '../../../shared/domain/enums/user-gender.enum.js'

export interface ProfileReference {
  id: string
  name: string
}

export interface ProfileAvatar {
  id: string
  filename: string
  originalName: string
  mimeType: string
  sizeBytes: number
  storageKey: string
}

export interface ProfileWithReferences {
  id: string
  userId: string
  identifier: string
  isActive: boolean
  name: string
  nik: string
  gender: UserGender
  birthPlace: string
  birthDate: Date
  email: string | null
  phone: string | null
  maritalStatus: MaritalStatus | null
  noKk: string | null
  npwp: string | null
  religion: ProfileReference | null
  bloodType: ProfileReference | null
  avatarFile: ProfileAvatar | null
}

export interface UpdateProfileRepositoryInput {
  name?: string
  nik?: string
  gender?: UserGender
  birthPlace?: string
  birthDate?: Date
  email?: string | null
  phone?: string | null
  religionId?: string | null
  bloodTypeId?: string | null
  maritalStatus?: MaritalStatus | null
  noKk?: string | null
  npwp?: string | null
}

export interface CreateAvatarFileInput {
  uploadedBy: string
  filename: string
  originalName: string
  mimeType: string
  sizeBytes: number
  storageKey: string
}

export abstract class IProfileRepository {
  abstract findByUserId(userId: string): Promise<ProfileWithReferences | null>
  abstract setAvatar(
    userId: string,
    file: CreateAvatarFileInput,
  ): Promise<{ profile: ProfileWithReferences; replacedKey: string | null }>
  abstract clearAvatar(
    userId: string,
  ): Promise<{ profile: ProfileWithReferences; replacedKey: string | null }>
  abstract findByNik(
    nik: string,
    excludeUserId: string,
  ): Promise<{ userId: string } | null>
  abstract findByEmail(
    email: string,
    excludeUserId: string,
  ): Promise<{ userId: string } | null>
  abstract findByPhone(
    phone: string,
    excludeUserId: string,
  ): Promise<{ userId: string } | null>
  abstract referenceExists(
    kind: 'religion' | 'bloodType',
    id: string,
  ): Promise<boolean>
  abstract update(
    userId: string,
    input: UpdateProfileRepositoryInput,
  ): Promise<ProfileWithReferences>
}
