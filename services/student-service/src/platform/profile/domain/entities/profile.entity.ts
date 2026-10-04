import { UserGender } from '../../../../shared/domain/enums/user-gender.enum.js'
import { MaritalStatus } from '../../../../shared/domain/enums/marital-status.enum.js'
import type { NamedRef } from '../../../../shared/domain/entities/index.js'

export interface ProfileEntity {
  id: string
  userId: string
  name: string
  nik: string
  gender: `${UserGender}`
  birthPlace: string
  birthDate: Date
  email?: string | null
  phone?: string | null
  religionId?: string | null
  bloodTypeId?: string | null
  maritalStatus?: `${MaritalStatus}` | null
  noKk?: string | null
  npwp?: string | null
  avatarFileId?: string | null
}

export type ProfileUpdateInput = Partial<Omit<ProfileEntity, 'id' | 'userId'>>

export interface ProfileFileRef {
  id: string
  filename: string
  originalName: string
  mimeType: string
  sizeBytes: number
  storageKey: string
}

export interface SocialMediaItem {
  id: string
  socialMediaId: string
  username?: string | null
  socialMedia: {
    name: string
    baseUrl?: string | null
  }
}

export interface ProfileWithDetails extends ProfileEntity {
  socialMedias?: SocialMediaItem[]
  religion?: NamedRef | null
  bloodType?: NamedRef | null
  avatarFile?: ProfileFileRef | null
}

export interface ProfileWithSocialMedias extends ProfileEntity {
  user: {
    userRoles: {
      role: {
        code: string
      }
    }[]
  }
  socialMedias: SocialMediaItem[]
}
