import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { IExamSessionRepository } from '../../../domain/repositories/exam-session.repository.js'

interface PublishClaims {
  sub?: string
  nonce?: string
  kind?: string
}

/** MediaMTX closes the session at the returned instant and asks again after that. */
const REAUTH_AFTER_MS = 60 * 1000

export type StreamAuthResult =
  { allowed: false } | { allowed: true; expireAt: Date }

/**
 * Answers MediaMTX's auth hook.
 *
 * A publish token is good only while its session is still running *and* its
 * nonce is still the one on the row: a rotation (a fresh heartbeat, a supervisor
 * release, a submit) kills every token issued before it. The returned `expireAt`
 * is what stops an already-open publish session at that moment — MediaMTX
 * re-authenticates when it lapses, and by then the nonce no longer matches.
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
    action: string,
    now: Date = new Date(),
  ): Promise<StreamAuthResult> {
    const log = (why: string) =>
      require('node:fs').appendFileSync('/tmp/stream-deny.log', `${why}\n`)

    const claims = await this.verify(token)
    if (!claims) return { allowed: false }

    const expireAt = new Date(now.getTime() + REAUTH_AFTER_MS)

    if (action === 'read') {
      // Supervisor playback. The token names the schedule it may watch, so a
      // teacher's link cannot be widened to another schedule by editing the path.
      if (claims.kind !== 'hls-read') return { allowed: false }
      if (claims.sub !== path) return { allowed: false }
      return { allowed: true, expireAt }
    }

    if (action !== 'publish') return { allowed: false }
    if (claims.kind !== 'whip-publish') return { allowed: false }
    if (!claims.sub || !claims.nonce) return { allowed: false }
    if (claims.sub !== path) return { allowed: false }

    const session = await this.sessions.findById(claims.sub)
    if (session?.status !== 'IN_PROGRESS') return { allowed: false }
    if (session.streamNonce !== claims.nonce) return { allowed: false }

    await this.sessions.touchStream(session.id, claims.nonce, now)
    return { allowed: true, expireAt }
  }

  private async verify(token: string): Promise<PublishClaims | null> {
    try {
      return await this.jwt.verifyAsync<PublishClaims>(token, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
      })
    } catch {
      return null
    }
  }
}
