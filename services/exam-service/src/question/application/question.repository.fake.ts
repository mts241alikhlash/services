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
  type NewQuestionInput,
  type PinnedQuestion,
  type QuestionPin,
  type VersionFields,
} from '../domain/repositories/question.repository.js'

export class FakeQuestionRepository extends IQuestionRepository {
  readonly questions = new Map<string, QuestionDetail>()
  readonly versions = new Map<string, QuestionVersion[]>()

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
          copiedFromQuestionId: question.copiedFromQuestionId,
          currentVersion: question.currentVersion,
          number: pin.number,
          type: question.type,
          bodyHtml: version.bodyHtml,
          content: version.content,
          points: version.points,
        })
      }
    }
    return Promise.resolve(found)
  }

  findById(id: string) {
    const question = this.questions.get(id)
    return Promise.resolve(question?.deletedAt === null ? question : null)
  }

  create(input: NewQuestionInput) {
    const id = randomUUID()
    const now = new Date()
    const current = this.version(id, 1, input, input.createdById)
    const question: QuestionDetail = {
      id,
      packageId: input.packageId,
      copiedFromQuestionId: input.copiedFromQuestionId ?? null,
      copiedFromVersion: input.copiedFromVersion ?? null,
      subjectId: input.subjectId,
      gradeId: input.gradeId,
      authorEmployeeId: input.authorEmployeeId,
      type: input.type,
      currentVersion: 1,
      revision: 1,
      createdById: input.createdById,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      current,
    }
    this.questions.set(id, question)
    this.versions.set(id, [current])
    return Promise.resolve(question)
  }

  addVersion(id: string, fields: VersionFields, createdById: string) {
    const question = this.questions.get(id)
    if (!question) throw new Error(`No question ${id}`)
    const current = this.version(
      id,
      question.currentVersion + 1,
      fields,
      createdById,
    )
    const updated: QuestionDetail = {
      ...question,
      currentVersion: current.number,
      revision: question.revision + 1,
      current,
      updatedAt: new Date(),
    }
    this.questions.set(id, updated)
    this.versions.set(id, [...(this.versions.get(id) ?? []), current])
    return Promise.resolve(updated)
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
    teachingAssignmentsOf: () => Promise.resolve([]),
    subjectsByIds: () => Promise.resolve([]),
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
