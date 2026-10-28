import type { FakeExamSessionRepository } from '../../exam-session/application/exam-session.repository.fake.js'
import {
  IScorePublicationRepository,
  type PublicationCandidate,
} from '../domain/repositories/score-publication.repository.js'

export interface FakePublicationState {
  attempts: number
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
        lastAttemptAt: null,
        lastError: null,
        sentAt: null,
      }
      this.states.set(sessionId, state)
    }
    return state
  }

  findCandidates(limit: number, excludeSessionIds: string[]) {
    const rows: PublicationCandidate[] = []
    for (const [sessionId, status] of this.sessions.publications) {
      if (status !== 'PENDING' || excludeSessionIds.includes(sessionId))
        continue
      const state = this.stateOf(sessionId)
      if (state.attempts >= 10) continue
      rows.push({
        sessionId,
        attempts: state.attempts,
        lastAttemptAt: state.lastAttemptAt,
      })
    }
    return Promise.resolve(rows.slice(0, limit))
  }

  markSent(sessionId: string, at: Date) {
    const state = this.stateOf(sessionId)
    state.sentAt = at
    state.lastAttemptAt = at
    state.lastError = null
    this.sessions.publications.set(sessionId, 'SENT')
    return Promise.resolve()
  }

  markFailed(sessionId: string, at: Date, reason: string) {
    const state = this.stateOf(sessionId)
    state.attempts += 1
    state.lastAttemptAt = at
    state.lastError = reason.slice(0, 300)
    return Promise.resolve()
  }
}
