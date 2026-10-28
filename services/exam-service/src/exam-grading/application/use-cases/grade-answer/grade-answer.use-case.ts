import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { IExamPackageRepository } from '../../../../exam-package/domain/repositories/exam-package.repository.js'
import { IExamScheduleRepository } from '../../../../exam-schedule/domain/repositories/exam-schedule.repository.js'
import { loadPaperSources } from '../../../../exam-session/application/load-paper-sources.js'
import { computeSessionResult } from '../../../../exam-session/domain/policies/compute-session-result.policy.js'
import { IExamSessionRepository } from '../../../../exam-session/domain/repositories/exam-session.repository.js'
import { IQuestionRepository } from '../../../../question/domain/repositories/question.repository.js'
import {
  isBlankAnswer,
  isManual,
  toGradingItem,
  type GradingItem,
} from '../../grading-item.js'
import {
  GradingScopeService,
  type GradingUser,
} from '../../grading-scope.service.js'

@Injectable()
export class GradeAnswerUseCase {
  constructor(
    private readonly scope: GradingScopeService,
    private readonly schedules: IExamScheduleRepository,
    private readonly packages: IExamPackageRepository,
    private readonly questions: IQuestionRepository,
    private readonly sessions: IExamSessionRepository,
  ) {}

  async execute(
    user: GradingUser,
    sessionId: string,
    questionId: string,
    grade: { score: number; note?: string | null },
    now: Date = new Date(),
  ): Promise<GradingItem> {
    const session = await this.sessions.findById(sessionId)
    const schedule = session
      ? await this.schedules.findById(session.scheduleId)
      : null
    const scope = await this.scope.forUser(user)
    if (
      session === null ||
      schedule === null ||
      !(await scope.allows(
        schedule.subjectId,
        schedule.classroomId,
        schedule.semesterId,
      ))
    ) {
      throw new NotFoundException('Sesi ujian tidak ditemukan')
    }
    if (session.status === 'IN_PROGRESS') {
      throw new ConflictException('Sesi ujian belum selesai')
    }

    const sources = await loadPaperSources(
      this.schedules,
      this.packages,
      this.questions,
      session.scheduleId,
    )
    const index = sources.findIndex((row) => row.questionId === questionId)
    const source = sources[index]
    if (index < 0) {
      throw new BadRequestException('Soal bukan bagian dari ujian ini')
    }
    if (!isManual(source.type)) {
      throw new BadRequestException('Soal ini dinilai otomatis')
    }
    if (
      !Number.isFinite(grade.score) ||
      grade.score < 0 ||
      grade.score > source.points
    ) {
      throw new BadRequestException(`Nilai harus antara 0 dan ${source.points}`)
    }

    const existing = (await this.sessions.listAnswers(session.id)).find(
      (row) => row.questionId === questionId,
    )
    if (isBlankAnswer(existing ?? null)) {
      throw new BadRequestException('Jawaban kosong tidak perlu dinilai')
    }

    const applied = await this.sessions.applyGrade(
      {
        sessionId: session.id,
        questionId,
        score: grade.score,
        note: grade.note?.trim() ? grade.note.trim() : null,
        gradedById: user.id,
        at: now,
      },
      (answers) => computeSessionResult(sources, answers),
    )
    if (applied === null) {
      throw new NotFoundException('Sesi ujian tidak ditemukan')
    }

    return toGradingItem(
      { ...source, type: source.type },
      index + 1,
      applied.answer,
    )
  }
}
