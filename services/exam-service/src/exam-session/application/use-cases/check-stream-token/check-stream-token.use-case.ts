import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { IExamSessionRepository } from '../../../domain/repositories/exam-session.repository.js'

interface PublishClaims {
  sub?: string
  nonce?: string
  kind?: string
}

/**
 * Answers MediaMTX's auth hook. A token is good only while its session is still
 * running *and* its nonce is still the one on the row: a rotation (a fresh
 * heartbeat, a supervisor release, a submit) kills every token issued before it.
 */
@Injectable()
export class CheckStreamTokenUseCase {
  constructor(
    private readonly sessions: IExamSessionRepository,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async execute(
    token: string,
    path: string,
    now: Date = new Date(),
  ): Promise<boolean> {
    let claims: PublishClaims
    try {
      claims = await this.jwt.verifyAsync<PublishClaims>(token, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
      })
    } catch {
      return false
    }

    if (claims.kind !== 'whip-publish') return false
    if (!claims.sub || !claims.nonce) return false
    if (claims.sub !== path) return false

    const session = await this.sessions.findById(claims.sub)
    if (session?.status !== 'IN_PROGRESS') return false
    if (session.streamNonce !== claims.nonce) return false

    await this.sessions.touchStream(session.id, claims.nonce, now)
    return true
  }
}
