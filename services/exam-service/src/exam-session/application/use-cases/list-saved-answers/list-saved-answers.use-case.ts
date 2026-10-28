import { Injectable } from '@nestjs/common'
import type { AnswerPayload } from '../../../domain/policies/validate-answer-shape.policy.js'
import { IExamSessionRepository } from '../../../domain/repositories/exam-session.repository.js'
import {
  SessionAccessService,
  type SessionActor,
} from '../../session-access.service.js'

export interface SavedAnswer {
  questionId: string
  answer: AnswerPayload
}

@Injectable()
export class ListSavedAnswersUseCase {
  constructor(
    private readonly access: SessionAccessService,
    private readonly sessions: IExamSessionRepository,
  ) {}

  async execute(
    user: SessionActor,
    sessionId: string,
    now: Date = new Date(),
  ): Promise<SavedAnswer[]> {
    const session = await this.access.loadReadable(user, sessionId, now)
    const answers = await this.sessions.listAnswers(session.id)
    return answers.map(({ questionId, answer }) => ({ questionId, answer }))
  }
}
