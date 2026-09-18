import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import {
  CreateOAuthUserRepositoryInput,
  CreateSessionRepositoryInput,
  IAuthRepository,
  UpdateSessionTokenRepositoryInput,
} from '../../../domain/repositories/auth.repository.js'
import {
  PROFILE_NAME_SELECT,
  USER_ROLES_FOR_AUTHZ_SELECT,
} from '../../../../shared/domain/prisma-selects.js'

const SESSION_USER_SELECT = {
  id: true,
  identifier: true,
  isActive: true,
  deletedAt: true,
} satisfies Prisma.UserSelect

@Injectable()
export class PrismaAuthRepository extends IAuthRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findUserByIdentifier(identifier: string) {
    return this.prisma.user.findFirst({
      where: { identifier, deletedAt: null },
      include: {
        userRoles: { include: { role: true } },
      },
    })
  }

  async findUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: PROFILE_NAME_SELECT,
        userRoles: USER_ROLES_FOR_AUTHZ_SELECT,
      },
    })
  }

  async findGrants(userId: string) {
    const rows = await this.prisma.userRole.findMany({
      where: { userId },
      select: {
        role: {
          select: {
            code: true,
            rolePermissions: {
              select: { permission: { select: { code: true } } },
            },
          },
        },
      },
    })

    const roles = rows.map((row) => row.role.code)
    const permissions = [
      ...new Set(
        rows.flatMap((row) =>
          row.role.rolePermissions.map((rp) => rp.permission.code),
        ),
      ),
    ]

    return { roles, permissions }
  }

  async findSessionWithUser(sessionId: string) {
    return this.prisma.authSession.findUnique({
      where: { id: sessionId },
      include: { user: { select: SESSION_USER_SELECT } },
    })
  }

  async createSession(data: CreateSessionRepositoryInput) {
    return this.prisma.authSession.create({
      data: {
        id: data.id,
        userId: data.userId,
        tokenHash: data.tokenHash,
        userAgent: data.userAgent?.substring(0, 512),
        ipAddress: data.ipAddress?.substring(0, 64),
        expiresAt: data.expiresAt,
      },
    })
  }

  async updateSessionToken(
    sessionId: string,
    data: UpdateSessionTokenRepositoryInput,
  ) {
    return this.prisma.authSession.update({
      where: { id: sessionId },
      data: {
        tokenHash: data.tokenHash,
        lastUsedAt: data.lastUsedAt,
        expiresAt: data.expiresAt,
      },
    })
  }

  async revokeSession(sessionId: string) {
    return this.prisma.authSession.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    })
  }

  async deleteExpiredSessions(now: Date, auditRetentionMs: number) {
    return this.prisma.authSession.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: now } },
          {
            revokedAt: {
              not: null,
              lt: new Date(now.getTime() - auditRetentionMs),
            },
          },
        ],
      },
    })
  }

  async updateUserPassword(userId: string, passwordHash: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    })
  }

  async revokeAllOtherUserSessions(userId: string, currentSessionId: string) {
    return this.prisma.authSession.updateMany({
      where: {
        userId,
        id: { not: currentSessionId },
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    })
  }

  async createPasswordResetToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ) {
    return this.prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    })
  }

  async findActivePasswordResetToken(tokenHash: string) {
    return this.prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
      include: {
        user: { select: SESSION_USER_SELECT },
      },
    })
  }

  async markPasswordResetTokenAsUsed(tokenId: string) {
    return this.prisma.passwordResetToken.update({
      where: { id: tokenId },
      data: { usedAt: new Date() },
    })
  }

  async findUserSessions(userId: string) {
    return this.prisma.authSession.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { lastUsedAt: 'desc' },
    })
  }

  async revokeAll(userId: string) {
    return this.prisma.authSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
  }

  async findUserByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { profile: { email }, deletedAt: null },
      include: {
        profile: PROFILE_NAME_SELECT,
        userRoles: USER_ROLES_FOR_AUTHZ_SELECT,
      },
    })
  }

  async findOAuthAccount(provider: string, providerUserId: string) {
    return this.prisma.oAuthAccount.findUnique({
      where: { provider_providerUserId: { provider, providerUserId } },
    })
  }

  async linkOAuthAccount(
    userId: string,
    provider: string,
    providerUserId: string,
    email: string,
  ) {
    return this.prisma.oAuthAccount.create({
      data: { userId, provider, providerUserId, email },
    })
  }

  async createUserFromOAuth(data: CreateOAuthUserRepositoryInput) {
    if (!data.roleCode) {
      return this.prisma.user.create({
        data: {
          identifier: data.identifier,
          isActive: true,
          oauthAccounts: {
            create: {
              provider: data.provider,
              providerUserId: data.providerUserId,
              email: data.email,
            },
          },
        },
        include: {
          profile: PROFILE_NAME_SELECT,
          userRoles: USER_ROLES_FOR_AUTHZ_SELECT,
        },
      })
    }

    const role = await this.prisma.role.findUnique({
      where: { code: data.roleCode },
    })

    if (!role) {
      throw new InternalServerErrorException(
        `The ${data.roleCode} role does not exist, so this account cannot be given one. ` +
          'It is created automatically when the application starts; if it is missing, restart the backend or add it on the role screen.',
      )
    }

    return this.prisma.user.create({
      data: {
        identifier: data.identifier,
        isActive: true,
        oauthAccounts: {
          create: {
            provider: data.provider,
            providerUserId: data.providerUserId,
            email: data.email,
          },
        },
        userRoles: {
          create: { roleId: role.id },
        },
      },
      include: {
        profile: PROFILE_NAME_SELECT,
        userRoles: USER_ROLES_FOR_AUTHZ_SELECT,
      },
    })
  }
}
