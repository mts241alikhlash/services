import { Injectable, NotFoundException } from '@nestjs/common'
import type { Readable } from 'node:stream'
import { GetExamFileUseCase } from '../../../../exam-file/application/use-cases/get-exam-file/get-exam-file.use-case.js'
import type { ExamFile } from '../../../../exam-file/domain/entities/exam-file.entity.js'
import { IExamPackageRepository } from '../../../../exam-package/domain/repositories/exam-package.repository.js'
import { IExamScheduleRepository } from '../../../../exam-schedule/domain/repositories/exam-schedule.repository.js'
import { IQuestionRepository } from '../../../../question/domain/repositories/question.repository.js'
import type { PaperSource } from '../../../domain/policies/build-paper.policy.js'
import { loadPaperSources } from '../../load-paper-sources.js'
import {
  SessionAccessService,
  type SessionActor,
} from '../../session-access.service.js'

const FILE_REFERENCE =
  /data-file-id="([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})"/giu

function referencedFileIds(sources: PaperSource[]): Set<string> {
  const ids = new Set<string>()
  for (const source of sources) {
    const choices =
      (source.content as { choices?: { html: string }[] }).choices ?? []
    const html = [
      source.bodyHtml,
      ...choices.map((choice) => choice.html),
    ].join(' ')
    for (const match of html.matchAll(FILE_REFERENCE)) {
      ids.add(match[1].toLowerCase())
    }
  }
  return ids
}

@Injectable()
export class GetSessionFileUseCase {
  constructor(
    private readonly access: SessionAccessService,
    private readonly schedules: IExamScheduleRepository,
    private readonly packages: IExamPackageRepository,
    private readonly questions: IQuestionRepository,
    private readonly getFile: GetExamFileUseCase,
  ) {}

  async execute(
    user: SessionActor,
    sessionId: string,
    fileId: string,
    now: Date = new Date(),
  ): Promise<{ file: ExamFile; stream: Readable }> {
    const session = await this.access.loadReadable(user, sessionId, now)
    const sources = await loadPaperSources(
      this.schedules,
      this.packages,
      this.questions,
      session.scheduleId,
    )
    if (!referencedFileIds(sources).has(fileId.toLowerCase())) {
      throw new NotFoundException('Gambar tidak ditemukan')
    }
    return this.getFile.execute(fileId)
  }
}
