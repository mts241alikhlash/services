import type { ExamSession } from '../entities/exam-session.entity.js'

export abstract class ISessionFinalizer {
  abstract finalizeIfDue(session: ExamSession, now: Date): Promise<ExamSession>
}
