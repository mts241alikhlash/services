import { ForbiddenException, Injectable, Logger } from '@nestjs/common'
import * as crypto from 'node:crypto'
import { IAuthRepository } from '../../../domain/repositories/auth.repository.js'
import { slidExpiry } from '../../../domain/policies/session-lifetime.policy.js'
import {
  CredentialsService,
  rolesOf,
} from '../../services/credentials.service.js'
import { TokenManagerService } from '../../services/token-manager.service.js'
import { nativeUserAgent } from './native-device.js'

const NATIVE_ROLES = ['STUDENT', 'TEACHER']

export interface NativeLoginInput {
  identifier: string
  password: string
  deviceId: string
}

export interface NativeAuthResult {
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: { id: string; name: string; roles: string[] }
}

@Injectable()
export class NativeLoginUseCase {
  private readonly logger = new Logger(NativeLoginUseCase.name)

  constructor(
    private readonly credentials: CredentialsService,
    private readonly tokens: TokenManagerService,
    private readonly authRepository: IAuthRepository,
  ) {}

  async execute(
    input: NativeLoginInput,
    ipAddress?: string,
  ): Promise<NativeAuthResult> {
    const user = await this.credentials.verify(input.identifier, input.password)
    const roles = rolesOf(user)
    if (!roles.some((role) => NATIVE_ROLES.includes(role))) {
      throw new ForbiddenException(
        'Akun ini tidak dapat masuk lewat aplikasi ujian',
      )
    }

    const sessionId = crypto.randomUUID()
    const grants = await this.authRepository.findGrants(user.id)
    const { accessToken, refreshToken } = await this.tokens.generateTokenPair(
      user,
      sessionId,
      grants,
    )

    const now = new Date()
    const absoluteExpiresAt = new Date(
      now.getTime() + this.tokens.getAbsoluteSessionMs(),
    )
    await this.authRepository.createSession({
      id: sessionId,
      userId: user.id,
      tokenHash: this.tokens.hashToken(refreshToken),
      userAgent: nativeUserAgent(input.deviceId),
      ipAddress,
      expiresAt: slidExpiry(
        now,
        this.tokens.getRefreshExpirationMs(),
        absoluteExpiresAt,
      ),
      absoluteExpiresAt,
    })

    const profile = await this.authRepository.findUserById(user.id)
    this.logger.log(`User ${user.identifier} signed in from the exam app`)

    return {
      accessToken,
      refreshToken,
      expiresIn: this.tokens.getAccessExpirationSeconds(),
      user: {
        id: user.id,
        name: profile?.profile?.name ?? user.identifier,
        roles,
      },
    }
  }
}
