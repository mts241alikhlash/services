import { Injectable } from '@nestjs/common'
import { IExamPackageRepository } from '../../../../exam-package/domain/repositories/exam-package.repository.js'
import { IExamScheduleRepository } from '../../../../exam-schedule/domain/repositories/exam-schedule.repository.js'
import { IQuestionRepository } from '../../../../question/domain/repositories/question.repository.js'
import {
  buildPaper,
  type PaperQuestion,
} from '../../../domain/policies/build-paper.policy.js'
import { loadPaperSources } from '../../load-paper-sources.js'
import {
  SessionAccessService,
  type SessionActor,
} from '../../session-access.service.js'

@Injectable()
export class GetPaperUseCase {
  constructor(
    private readonly access: SessionAccessService,
    private readonly schedules: IExamScheduleRepository,
    private readonly packages: IExamPackageRepository,
    private readonly questions: IQuestionRepository,
  ) {}

  async execute(
    user: SessionActor,
    sessionId: string,
    now: Date = new Date(),
  ): Promise<PaperQuestion[]> {
    const session = await this.access.loadReadable(user, sessionId, now)
    const sources = await loadPaperSources(
      this.schedules,
      this.packages,
      this.questions,
      session.scheduleId,
    )
    return buildPaper(sources, session.shuffleSeed)
  }
}
