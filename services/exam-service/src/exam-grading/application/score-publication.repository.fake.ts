import type { FakeExamSessionRepository } from '../../exam-session/application/exam-session.repository.fake.js'
import { publicationWaitMs } from './use-cases/publish-scores/publish-scores.use-case.js'
import {
  IScorePublicationRepository,
  type PublicationCandidate,
} from '../domain/repositories/score-publication.repository.js'

export interface FakePublicationState {
  attempts: number
  permanentFailures: number
  lastAttemptAt: Date | null
  lastError: string | null
  sentAt: Date | null
}

export class FakeScorePublicationRepository extends IScorePublicationRepository {
  readonly states = new Map<string, FakePublicationState>()

  constructor(private readonly sessions: FakeExamSessionRepository) {
    super()
  }

  private stateOf(sessionId: string): FakePublicationState {
    let state = this.states.get(sessionId)
    if (state === undefined) {
      state = {
        attempts: 0,
        permanentFailures: 0,
        lastAttemptAt: null,
        lastError: null,
        sentAt: null,
      }
      this.states.set(sessionId, state)
    }
    return state
  }

  findCandidates(now: Date, limit: number, excludeSessionIds: string[]) {
    const rows: PublicationCandidate[] = []
    for (const [sessionId, status] of this.sessions.publications) {
      if (status !== 'PENDING' || excludeSessionIds.includes(sessionId))
        continue
      const state = this.stateOf(sessionId)
      if (state.permanentFailures >= 10) continue
      if (
        state.lastAttemptAt !== null &&
        now.getTime() - state.lastAttemptAt.getTime() <
          publicationWaitMs(state.attempts)
      ) {
        continue
      }
      rows.push({
        sessionId,
        attempts: state.attempts,
        lastAttemptAt: state.lastAttemptAt,
      })
    }
    return Promise.resolve(rows.slice(0, limit))
  }

  private isCurrent(sessionId: string, gradedAt: Date | null): boolean {
    const current = this.sessions.sessions.get(sessionId)?.gradedAt ?? null
    return current?.getTime() === gradedAt?.getTime()
  }

  markSent(sessionId: string, at: Date, gradedAt: Date | null) {
    if (!this.isCurrent(sessionId, gradedAt)) return Promise.resolve()
    const state = this.stateOf(sessionId)
    state.sentAt = at
    state.lastAttemptAt = at
    state.lastError = null
    this.sessions.publications.set(sessionId, 'SENT')
    return Promise.resolve()
  }

  markFailed(
    sessionId: string,
    at: Date,
    reason: string,
    permanent: boolean,
    gradedAt: Date | null,
  ) {
    if (!this.isCurrent(sessionId, gradedAt)) return Promise.resolve()
    const state = this.stateOf(sessionId)
    state.attempts += 1
    if (permanent) state.permanentFailures += 1
    state.lastAttemptAt = at
    state.lastError = reason.slice(0, 300)
    return Promise.resolve()
  }
}
