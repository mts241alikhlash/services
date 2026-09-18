import {
  PaginatedResult,
  PaginationQueryInput,
} from '../../../../shared/domain/interfaces/repository.interface.js'
import {
  CredentialEntity,
  CredentialResolution,
  CredentialWithCode,
  CredentialWithHolder,
  PresenceSubjectTypeEnum,
} from '../entities/credential.entity.js'

export type { CredentialResolution, CredentialWithCode, CredentialWithHolder }

export interface CredentialQueryInput extends PaginationQueryInput {
  subjectType?: PresenceSubjectTypeEnum
  status?: 'ACTIVE' | 'REVOKED' | 'REPLACED'
  userId?: string
  search?: string
}

export interface CreateCredentialRepositoryInput {
  userId: string
  subjectType: PresenceSubjectTypeEnum
  code: string
  issuedBy?: string | null
}

export interface RevokeCredentialRepositoryInput {
  revokedAt: Date
  revokedReason: string
}

export interface ReplaceCredentialRepositoryInput {
  previousId: string
  userId: string
  subjectType: PresenceSubjectTypeEnum
  code: string
  issuedBy?: string | null
  revokedAt: Date
  revokedReason: string
}

export abstract class ICredentialRepository {
  abstract findAll(
    query: CredentialQueryInput,
  ): Promise<PaginatedResult<CredentialWithHolder>>
  abstract findById(id: string): Promise<CredentialWithHolder | null>
  abstract findActiveByUserId(userId: string): Promise<CredentialEntity | null>
  abstract findByCode(code: string): Promise<CredentialResolution | null>
  abstract findForPrint(userIds: string[]): Promise<CredentialWithCode[]>

  abstract wasValidOnDate(userId: string, date: Date): Promise<boolean>

  abstract create(
    input: CreateCredentialRepositoryInput,
  ): Promise<CredentialWithCode>
  abstract revoke(
    id: string,
    input: RevokeCredentialRepositoryInput,
  ): Promise<CredentialEntity>
  abstract replace(
    input: ReplaceCredentialRepositoryInput,
  ): Promise<CredentialWithCode>
  abstract softDelete(id: string): Promise<CredentialEntity>
}
