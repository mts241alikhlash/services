import { ConflictException, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { randomUUID } from 'node:crypto'
import {
  SessionAccessService,
  type SessionActor,
} from '../../session-access.service.js'
import { IExamSessionRepository } from '../../../domain/repositories/exam-session.repository.js'

/** A publish token is short-lived; the stream re-fetches it to prove it is alive. */
const TOKEN_TTL_MS = 5 * 60 * 1000

export interface IssuedStreamToken {
  publishUrl: string
  expiresAt: Date
  heartbeatSeconds: number
}

@Injectable()
export class IssueStreamTokenUseCase {
  constructor(
    private readonly access: SessionAccessService,
    private readonly sessions: IExamSessionRepository,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async execute(
    actor: SessionActor,
    sessionId: string,
    now: Date = new Date(),
  ): Promise<IssuedStreamToken> {
    const session = await this.access.loadOwned(actor, sessionId, now)
    if (session.status !== 'IN_PROGRESS') {
      throw new ConflictException('Sesi ujian tidak sedang berlangsung')
    }

    // Every issue rotates the nonce, so a token handed out before this call stops
    // authorising a publish even though its own JWT has not expired yet.
    const nonce = randomUUID()
    await this.sessions.touchStream(session.id, nonce, now)

    const expiresAt = new Date(
      Math.min(session.deadline.getTime(), now.getTime() + TOKEN_TTL_MS),
    )
    if (expiresAt.getTime() <= now.getTime()) {
      throw new ConflictException('Waktu ujian sudah habis')
    }
    const token = await this.jwt.signAsync(
      { sub: session.id, nonce, kind: 'whip-publish' },
      {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        expiresIn: Math.floor((expiresAt.getTime() - now.getTime()) / 1000),
      },
    )

    // RTMPS, not WHIP: WHIP only exists in RootEncoder 2.8.x, which needs AGP 9.
    // MediaMTX listens for RTMPS on 1936 with a certificate, so a home router has
    // nothing to block and the stream is still encrypted end to end.
    const base = this.config
      .get<string>('STREAM_RTMP_URL', 'rtmps://stream.invalid:1936')
      .replace(/\/$/, '')

    return {
      publishUrl: `${base}/${session.id}?token=${encodeURIComponent(token)}`,
      expiresAt,
      heartbeatSeconds: 20,
    }
  }
}
