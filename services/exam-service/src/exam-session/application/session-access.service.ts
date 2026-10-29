import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import type { ExamSession } from '../domain/entities/exam-session.entity.js'
import { IExamSessionRepository } from '../domain/repositories/exam-session.repository.js'
import { ISessionFinalizer } from '../domain/repositories/session-finalizer.port.js'

export interface SessionActor {
  id: string
  deviceId: string
}

@Injectable()
export class SessionAccessService {
  constructor(
    private readonly sessions: IExamSessionRepository,
    private readonly finalizer: ISessionFinalizer,
  ) {}

  async loadOwned(
    actor: SessionActor,
    sessionId: string,
    now: Date,
  ): Promise<ExamSession> {
    const session = await this.sessions.findById(sessionId)
    if (session?.userId !== actor.id) {
      throw new NotFoundException('Sesi ujian tidak ditemukan')
    }
    const current = await this.finalizer.finalizeIfDue(session, now)
    if (
      current.status === 'IN_PROGRESS' &&
      current.deviceId !== actor.deviceId
    ) {
      throw new ConflictException(
        current.deviceId === null
          ? 'Sesi dilepas. Mulai ujian lagi'
          : 'Sesi aktif di perangkat lain. Minta pengawas melepas sesi',
      )
    }
    return current
  }

  async loadReadable(
    actor: SessionActor,
    sessionId: string,
    now: Date,
  ): Promise<ExamSession> {
    const session = await this.loadOwned(actor, sessionId, now)
    if (now.getTime() >= session.finalizeAt.getTime()) {
      throw new ConflictException('Waktu ujian sudah berakhir')
    }
    return session
  }
}
