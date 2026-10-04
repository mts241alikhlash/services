import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import { IProfileLookupPort } from '../../../../platform/profile-lookup/profile-lookup.port.js'
import { PaginatedResult } from '../../../../shared/domain/interfaces/repository.interface.js'
import {
  CredentialEntity,
  CredentialHolderRef,
  CredentialResolution,
  CredentialWithCode,
  CredentialWithHolder,
} from '../../domain/entities/credential.entity.js'
import {
  CreateCredentialRepositoryInput,
  CredentialQueryInput,
  ICredentialRepository,
  ReplaceCredentialRepositoryInput,
  RevokeCredentialRepositoryInput,
} from '../../domain/interfaces/credential-repository.interface.js'
import { toHolderRef } from './prisma-credential.includes.js'
import {
  credentialWhere,
  NOT_DELETED,
  validOnDateWhere,
} from './prisma-credential.where.js'

@Injectable()
export class PrismaCredentialRepository implements ICredentialRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profileLookupPort: IProfileLookupPort,
  ) {}

  private async attachHolders<T extends { userId: string }>(
    rows: T[],
  ): Promise<(T & { holder: CredentialHolderRef })[]> {
    const profiles = await this.profileLookupPort.findByUserIds(
      rows.map((row) => row.userId),
    )
    const byUserId = new Map(
      profiles.map((profile) => [profile.userId, profile]),
    )

    return rows.map((row) => ({
      ...row,
      holder: toHolderRef(row.userId, byUserId.get(row.userId)),
    }))
  }

  async findAll(
    query: CredentialQueryInput,
  ): Promise<PaginatedResult<CredentialWithHolder>> {
    const page = query.page ?? 1
    const limit = query.limit ?? 10
    const where = credentialWhere(query)

    const rows = await this.prisma.presenceCredential.findMany({
      where,
      orderBy: { issuedAt: 'desc' },
    })

    const withHolder = await this.attachHolders(rows)
    const needle = query.search?.trim().toLowerCase()
    const filtered = needle
      ? withHolder.filter((row) =>
          row.holder.displayName?.toLowerCase().includes(needle),
        )
      : withHolder

    const skip = (page - 1) * limit
    return {
      data: filtered.slice(skip, skip + limit),
      total: filtered.length,
      page,
      limit,
    }
  }

  async findById(id: string): Promise<CredentialWithHolder | null> {
    const row = await this.prisma.presenceCredential.findFirst({
      where: { id, ...NOT_DELETED },
    })
    if (!row) return null

    const [withHolder] = await this.attachHolders([row])
    return withHolder
  }

  async findActiveByUserId(userId: string): Promise<CredentialEntity | null> {
    return this.prisma.presenceCredential.findFirst({
      where: { userId, status: 'ACTIVE', ...NOT_DELETED },
    })
  }

  async findByCode(code: string): Promise<CredentialResolution | null> {
    const row = await this.prisma.presenceCredential.findFirst({
      where: { code, ...NOT_DELETED },
      select: { id: true, userId: true, subjectType: true, status: true },
    })
    if (!row) return null

    const [profile] = await this.profileLookupPort.findByUserIds([row.userId])

    return {
      id: row.id,
      userId: row.userId,
      subjectType: row.subjectType,
      status: row.status,
      holderIsActive: profile?.isActive ?? false,
      displayName: profile?.name ?? null,
      photoUrl: profile?.avatarStorageKey
        ? `/files/${profile.avatarStorageKey}`
        : null,
    }
  }

  async findForPrint(userIds: string[]): Promise<CredentialWithCode[]> {
    const rows = await this.prisma.presenceCredential.findMany({
      where: { userId: { in: userIds }, status: 'ACTIVE', ...NOT_DELETED },
    })

    return this.attachHolders(rows)
  }

  async wasValidOnDate(userId: string, date: Date): Promise<boolean> {
    const count = await this.prisma.presenceCredential.count({
      where: validOnDateWhere(userId, date),
    })

    return count > 0
  }

  async create(
    input: CreateCredentialRepositoryInput,
  ): Promise<CredentialWithCode> {
    const row = await this.prisma.presenceCredential.create({ data: input })
    const [withHolder] = await this.attachHolders([row])
    return withHolder
  }

  async revoke(
    id: string,
    input: RevokeCredentialRepositoryInput,
  ): Promise<CredentialEntity> {
    return this.prisma.presenceCredential.update({
      where: { id },
      data: { status: 'REVOKED', ...input },
    })
  }

  async replace(
    input: ReplaceCredentialRepositoryInput,
  ): Promise<CredentialWithCode> {
    const { previousId, revokedAt, revokedReason, ...issue } = input

    const row = await this.prisma.$transaction(async (tx) => {
      const created = await tx.presenceCredential.create({ data: issue })

      await tx.presenceCredential.update({
        where: { id: previousId },
        data: {
          status: 'REPLACED',
          revokedAt,
          revokedReason,
          replacedById: created.id,
        },
      })

      return created
    })

    const [withHolder] = await this.attachHolders([row])
    return withHolder
  }

  async softDelete(id: string): Promise<CredentialEntity> {
    return this.prisma.presenceCredential.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }
}
