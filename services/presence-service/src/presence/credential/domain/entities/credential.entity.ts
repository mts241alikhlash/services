import { CredentialStatus, PresenceSubjectType } from '@prisma/client'

export type CredentialStatusEnum = `${CredentialStatus}`
export type PresenceSubjectTypeEnum = `${PresenceSubjectType}`

export interface CredentialEntity {
  id: string
  userId: string
  subjectType: PresenceSubjectTypeEnum
  status: CredentialStatusEnum
  issuedAt: Date
  issuedBy?: string | null
  revokedAt?: Date | null
  revokedReason?: string | null
  replacedById?: string | null
  deletedAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface CredentialHolderRef {
  id: string
  identifier: string
  displayName: string | null
  photoUrl: string | null
}

export interface CredentialWithHolder extends CredentialEntity {
  holder: CredentialHolderRef
}

export interface CredentialWithCode extends CredentialWithHolder {
  code: string
}

export interface CredentialResolution {
  id: string
  userId: string
  subjectType: PresenceSubjectTypeEnum
  status: CredentialStatusEnum
  holderIsActive: boolean
  displayName: string | null
  photoUrl: string | null
}
