import { Injectable } from '@nestjs/common'
import { IExamSessionRepository } from '../../../domain/repositories/exam-session.repository.js'
import {
  SessionAccessService,
  type SessionActor,
} from '../../session-access.service.js'

@Injectable()
export class RecordViolationsUseCase {
  constructor(
    private readonly access: SessionAccessService,
    private readonly sessions: IExamSessionRepository,
  ) {}

  async execute(
    user: SessionActor,
    sessionId: string,
    count: number,
    now: Date = new Date(),
  ): Promise<number> {
    const session = await this.access.loadOwned(user, sessionId, now)
    if (session.status !== 'IN_PROGRESS') return session.violationCount
    if (count > session.violationCount) {
      await this.sessions.recordViolations(session.id, count)
    }
    return (await this.sessions.findById(session.id))?.violationCount ?? count
  }
}
