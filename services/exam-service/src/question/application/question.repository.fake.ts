import { randomUUID } from 'node:crypto'
import type { IAcademicLookupPort } from '../../platform/academic-lookup/academic-lookup.port.js'
import type { IEmployeeIdentityReadPort } from '../../platform/employee-identity/employee-identity.port.js'
import { TeacherScope } from './teacher-scope.service.js'
import type {
  QuestionDetail,
  QuestionVersion,
} from '../domain/entities/question.entity.js'
import {
  IQuestionRepository,
  type ExpectedState,
  type NewQuestionInput,
  type PinnedQuestion,
  type QuestionPin,
  type QuestionListQuery,
  type QuestionSummary,
  type ReviewInput,
  type VersionFields,
} from '../domain/repositories/question.repository.js'
import type { QuestionStatus } from '../domain/value-objects/question-content.js'

export class FakeQuestionRepository extends IQuestionRepository {
  readonly questions = new Map<string, QuestionDetail>()
  readonly versions = new Map<string, QuestionVersion[]>()

  findApprovedRefs(ids: string[]) {
    return Promise.resolve(
      ids.flatMap((id) => {
        const question = this.questions.get(id)
        return question
          ? [
              {
                id: question.id,
                subjectId: question.subjectId,
                gradeId: question.gradeId,
                status: question.status,
                approvedVersion: question.approvedVersion,
                deletedAt: question.deletedAt,
              },
            ]
          : []
      }),
    )
  }

  findPinned(pins: QuestionPin[]) {
    const found: PinnedQuestion[] = []
    for (const pin of pins) {
      const question = this.questions.get(pin.questionId)
      const version = (this.versions.get(pin.questionId) ?? []).find(
        (candidate) => candidate.number === pin.number,
      )
      if (question && version) {
        found.push({
          questionId: pin.questionId,
          number: pin.number,
          type: question.type,
          bodyHtml: version.bodyHtml,
          points: version.points,
        })
      }
    }
    return Promise.resolve(found)
  }

  findAll(query: QuestionListQuery) {
    const rows = [...this.questions.values()]
      .filter((question) => question.deletedAt === null)
      .filter(
        (question) =>
          query.pairs === null ||
          query.pairs.some(
            (pair) =>
              pair.subjectId === question.subjectId &&
              pair.gradeId === question.gradeId,
          ),
      )
      .filter(
        (question) =>
          !query.subjectId || question.subjectId === query.subjectId,
      )
      .filter(
        (question) => !query.gradeId || question.gradeId === query.gradeId,
      )
      .filter((question) => !query.type || question.type === query.type)
      .filter((question) => !query.status || question.status === query.status)
      .filter(
        (question) =>
          !query.authorEmployeeId ||
          question.authorEmployeeId === query.authorEmployeeId,
      )
      .filter(
        (question) =>
          !query.search || question.current.bodyHtml.includes(query.search),
      )
    const data: QuestionSummary[] = rows
      .slice((query.page - 1) * query.limit, query.page * query.limit)
      .map(({ current, ...question }) => ({
        ...question,
        bodyHtml: current.bodyHtml,
        points: current.points,
      }))
    return Promise.resolve({
      data,
      total: rows.length,
      page: query.page,
      limit: query.limit,
    })
  }

  findAuthorIds(
    pairs: { subjectId: string; gradeId: string }[] | null,
    status?: QuestionStatus,
  ) {
    const authors = [...this.questions.values()]
      .filter((question) => question.deletedAt === null)
      .filter(
        (question) =>
          pairs === null ||
          pairs.some(
            (pair) =>
              pair.subjectId === question.subjectId &&
              pair.gradeId === question.gradeId,
          ),
      )
      .filter((question) => !status || question.status === status)
      .map((question) => question.authorEmployeeId)
    return Promise.resolve([...new Set(authors)])
  }

  findById(id: string) {
    const question = this.questions.get(id)
    return Promise.resolve(question?.deletedAt === null ? question : null)
  }

  findVersions(questionId: string) {
    return Promise.resolve(this.versions.get(questionId) ?? [])
  }

  create(input: NewQuestionInput) {
    const id = randomUUID()
    const now = new Date()
    const current = this.version(id, 1, input, input.createdById)
    const question: QuestionDetail = {
      id,
      subjectId: input.subjectId,
      gradeId: input.gradeId,
      authorEmployeeId: input.authorEmployeeId,
      type: input.type,
      status: 'DRAFT',
      currentVersion: 1,
      approvedVersion: null,
      revision: 1,
      createdById: input.createdById,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      current,
      approved: null,
      reviews: [],
    }
    this.questions.set(id, question)
    this.versions.set(id, [current])
    return Promise.resolve(question)
  }

  editCurrentVersion(
    id: string,
    fields: VersionFields,
    status: QuestionStatus,
    expected: ExpectedState,
  ) {
    const question = this.require(id)
    if (!this.matches(question, expected)) return Promise.resolve(null)
    const current: QuestionVersion = { ...question.current, ...fields }
    const updated = {
      ...question,
      status,
      current,
      revision: question.revision + 1,
      updatedAt: new Date(),
    }
    this.questions.set(id, updated)
    this.versions.set(
      id,
      (this.versions.get(id) ?? []).map((version) =>
        version.number === current.number ? current : version,
      ),
    )
    return Promise.resolve(updated)
  }

  addVersion(
    id: string,
    fields: VersionFields,
    createdById: string,
    expected?: ExpectedState,
  ) {
    const question = this.require(id)
    if (expected && !this.matches(question, expected)) {
      return Promise.resolve(null)
    }
    const current = this.version(
      id,
      question.currentVersion + 1,
      fields,
      createdById,
    )
    const updated: QuestionDetail = {
      ...question,
      status: 'DRAFT',
      currentVersion: current.number,
      revision: question.revision + 1,
      current,
      updatedAt: new Date(),
    }
    this.questions.set(id, updated)
    this.versions.set(id, [...(this.versions.get(id) ?? []), current])
    return Promise.resolve(updated)
  }

  softDeleteNeverApproved(id: string) {
    const question = this.require(id)
    if (question.approvedVersion !== null) return Promise.resolve(false)
    this.questions.set(id, { ...question, deletedAt: new Date() })
    return Promise.resolve(true)
  }

  private matches(question: QuestionDetail, expected: ExpectedState): boolean {
    return (
      question.status === expected.status &&
      question.currentVersion === expected.currentVersion
    )
  }

  applyReview(id: string, input: ReviewInput) {
    const question = this.questions.get(id)
    if (
      !question ||
      !input.from.includes(question.status) ||
      question.currentVersion !== input.expectedVersion ||
      (input.expectedRevision !== undefined &&
        question.revision !== input.expectedRevision)
    ) {
      return Promise.resolve(null)
    }
    const updated: QuestionDetail = {
      ...question,
      status: input.to,
      ...(input.action === 'APPROVED'
        ? {
            approvedVersion: question.currentVersion,
            approved: question.current,
          }
        : {}),
      reviews: [
        ...question.reviews,
        {
          id: randomUUID(),
          questionId: id,
          versionNumber: question.currentVersion,
          action: input.action,
          note: input.note,
          byUserId: input.byUserId,
          createdAt: new Date(),
        },
      ],
    }
    this.questions.set(id, updated)
    return Promise.resolve(updated)
  }

  approve(id: string): void {
    const question = this.require(id)
    this.questions.set(id, {
      ...question,
      status: 'APPROVED',
      approvedVersion: question.currentVersion,
      approved: question.current,
    })
  }

  private require(id: string): QuestionDetail {
    const question = this.questions.get(id)
    if (!question) throw new Error(`no question ${id}`)
    return question
  }

  private version(
    questionId: string,
    number: number,
    fields: VersionFields,
    createdById: string,
  ): QuestionVersion {
    return {
      id: randomUUID(),
      questionId,
      number,
      bodyHtml: fields.bodyHtml,
      content: fields.content,
      points: fields.points,
      createdById,
      createdAt: new Date(),
    }
  }
}

export interface ScopeFixture {
  employeeId: string | null
  pairs?: { subjectId: string; gradeId: string }[]
  existingEmployees?: string[]
  grades?: { id: string; level: number; name: string | null }[]
}

export function buildTeacherScope(fixture: ScopeFixture): {
  scope: TeacherScope
  employees: IEmployeeIdentityReadPort
  academic: IAcademicLookupPort
} {
  const employees = {
    findEmployeeIdByUserId: () => Promise.resolve(fixture.employeeId),
    employeeExists: (id: string) =>
      Promise.resolve((fixture.existingEmployees ?? []).includes(id)),
  } as IEmployeeIdentityReadPort
  const academic = {
    teachingPairsOf: () => Promise.resolve(fixture.pairs ?? []),
    classroomsByIds: () => Promise.resolve([]),
    activeSemester: () => Promise.resolve(null),
    gradesByIds: (ids: string[]) =>
      Promise.resolve(
        (fixture.grades ?? []).filter((grade) => ids.includes(grade.id)),
      ),
  } as IAcademicLookupPort
  return { scope: new TeacherScope(employees, academic), employees, academic }
}

export const TEACHER = {
  id: 'user-1',
  roles: ['TEACHER'],
  permissions: ['exam-questions.read'],
}

export const MANAGER = {
  id: 'user-2',
  roles: ['CURRICULUM_STAFF'],
  permissions: ['exam-questions.read', 'exam-questions.manage-all'],
}

export const MATH_7 = { subjectId: 'math', gradeId: 'grade-7' }
