import type { ExamSession } from '../domain/entities/exam-session.entity.js'
import { ISessionFinalizer } from '../domain/repositories/session-finalizer.port.js'

export class FakeSessionFinalizer extends ISessionFinalizer {
  readonly calls: string[] = []

  finalizeIfDue(session: ExamSession) {
    this.calls.push(session.id)
    return Promise.resolve(session)
  }
}
