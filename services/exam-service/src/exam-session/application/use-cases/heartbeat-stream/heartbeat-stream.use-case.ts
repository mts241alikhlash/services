import { Injectable } from '@nestjs/common'
import {
  SessionAccessService,
  type SessionActor,
} from '../../session-access.service.js'
import { IExamSessionRepository } from '../../../domain/repositories/exam-session.repository.js'

/**
 * Keeps `lastSeenAt` fresh while a stream is up, without touching the nonce.
 *
 * Rotating the nonce here would invalidate the publish token the running stream
 * is still using, so this writes the same nonce back with a new timestamp. The
 * supervisor grid reads `lastSeenAt` to decide whether a seat is live.
 */
@Injectable()
export class HeartbeatStreamUseCase {
  constructor(
    private readonly access: SessionAccessService,
    private readonly sessions: IExamSessionRepository,
  ) {}

  async execute(
    actor: SessionActor,
    sessionId: string,
    now: Date = new Date(),
  ): Promise<void> {
    const session = await this.access.loadOwned(actor, sessionId, now)
    if (session.status !== 'IN_PROGRESS') return
    if (session.streamNonce === null) return
    await this.sessions.touchStream(session.id, session.streamNonce, now)
  }
}
