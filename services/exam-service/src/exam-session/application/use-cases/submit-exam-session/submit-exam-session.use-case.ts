import { Injectable } from '@nestjs/common'
import { FinalizeSessionService } from '../../finalize-session.service.js'
import {
  SessionAccessService,
  type SessionActor,
} from '../../session-access.service.js'

export interface SubmitResult {
  status: string
  submittedAt: Date | null
}

@Injectable()
export class SubmitExamSessionUseCase {
  constructor(
    private readonly access: SessionAccessService,
    private readonly finalizer: FinalizeSessionService,
  ) {}

  async execute(
    user: SessionActor,
    sessionId: string,
    now: Date = new Date(),
  ): Promise<SubmitResult> {
    const session = await this.access.loadOwned(user, sessionId, now)
    const closed =
      session.status === 'IN_PROGRESS'
        ? await this.finalizer.finalize(session.id, 'SUBMITTED', now)
        : session
    return { status: closed.status, submittedAt: closed.submittedAt }
  }
}
