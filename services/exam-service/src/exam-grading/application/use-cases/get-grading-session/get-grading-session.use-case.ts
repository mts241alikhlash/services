import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { loadPaperSources } from '../../../../exam-session/application/load-paper-sources.js'
import { IExamPackageRepository } from '../../../../exam-package/domain/repositories/exam-package.repository.js'
import { IExamScheduleRepository } from '../../../../exam-schedule/domain/repositories/exam-schedule.repository.js'
import type { AnswerPayload } from '../../../../exam-session/domain/policies/validate-answer-shape.policy.js'
import { IExamSessionRepository } from '../../../../exam-session/domain/repositories/exam-session.repository.js'
import { IStudentDirectoryPort } from '../../../../platform/student-directory/student-directory.port.js'
import { IQuestionRepository } from '../../../../question/domain/repositories/question.repository.js'
import {
  GradingScopeService,
  type GradingUser,
} from '../../grading-scope.service.js'

export interface GradingItem {
  questionId: string
  number: number
  type: 'SHORT_ANSWER' | 'ESSAY'
  bodyHtml: string
  points: number
  guideHtml: string | null
  acceptedAnswers: string[] | null
  answer: AnswerPayload | null
  score: number | null
  note: string | null
  gradedAt: Date | null
  needsGrading: boolean
}

export interface GradingSessionDetail {
  session: {
    sessionId: string
    scheduleId: string
    studentId: string
    studentName: string | null
    studentNis: string | null
    status: string
    rawScore: number | null
    maxScore: number | null
  }
  items: GradingItem[]
}

@Injectable()
export class GetGradingSessionUseCase {
  constructor(
    private readonly scope: GradingScopeService,
    private readonly schedules: IExamScheduleRepository,
    private readonly packages: IExamPackageRepository,
    private readonly questions: IQuestionRepository,
    private readonly sessions: IExamSessionRepository,
    private readonly students: IStudentDirectoryPort,
  ) {}

  async execute(
    user: GradingUser,
    sessionId: string,
  ): Promise<GradingSessionDetail> {
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

    const [sources, answers, refs] = await Promise.all([
      loadPaperSources(
        this.schedules,
        this.packages,
        this.questions,
        session.scheduleId,
      ),
      this.sessions.listAnswers(session.id),
      this.students.refsByIds([session.studentId]),
    ])
    const answerOf = new Map(answers.map((row) => [row.questionId, row]))

    const items: GradingItem[] = []
    sources.forEach((source, index) => {
      if (source.type !== 'SHORT_ANSWER' && source.type !== 'ESSAY') return
      const answer = answerOf.get(source.questionId) ?? null
      const blank =
        answer === null ||
        ('text' in answer.answer && answer.answer.text.trim() === '')
      const content = source.content as {
        guideHtml?: string | null
        answer?: { accepted: string[] }
      }
      items.push({
        questionId: source.questionId,
        number: index + 1,
        type: source.type,
        bodyHtml: source.bodyHtml,
        points: source.points,
        guideHtml: source.type === 'ESSAY' ? (content.guideHtml ?? null) : null,
        acceptedAnswers:
          source.type === 'SHORT_ANSWER'
            ? (content.answer?.accepted ?? [])
            : null,
        answer: answer?.answer ?? null,
        score: answer?.score ?? null,
        note: answer?.gradeNote ?? null,
        gradedAt: answer?.gradedAt ?? null,
        needsGrading: !blank && answer.score === null,
      })
    })

    const ref = refs[0]
    return {
      session: {
        sessionId: session.id,
        scheduleId: session.scheduleId,
        studentId: session.studentId,
        studentName: ref?.name ?? null,
        studentNis: ref?.nis ?? null,
        status: session.status,
        rawScore: session.rawScore,
        maxScore: session.maxScore,
      },
      items,
    }
  }
}
