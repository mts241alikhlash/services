import { Injectable, Logger } from '@nestjs/common'
import { IExamSessionRepository } from '../../../domain/repositories/exam-session.repository.js'
import { FinalizeSessionService } from '../../finalize-session.service.js'

export const FINALIZE_BATCH = 100
const MAX_ROUNDS = 20

@Injectable()
export class FinalizeDueSessionsUseCase {
  private readonly logger = new Logger(FinalizeDueSessionsUseCase.name)

  constructor(
    private readonly sessions: IExamSessionRepository,
    private readonly finalizer: FinalizeSessionService,
  ) {}

  async execute(now: Date = new Date()): Promise<number> {
    const failed: string[] = []
    let closed = 0
    for (let round = 0; round < MAX_ROUNDS; round += 1) {
      const ids = await this.sessions.findDueIds(now, FINALIZE_BATCH, failed)
      for (const id of ids) {
        try {
          await this.finalizer.finalize(id, 'EXPIRED', now)
          closed += 1
        } catch (error) {
          failed.push(id)
          this.logger.error(
            `Failed to finalize session ${id}`,
            error instanceof Error ? error.stack : String(error),
          )
        }
      }
      if (ids.length < FINALIZE_BATCH) break
    }
    return closed
  }
}
