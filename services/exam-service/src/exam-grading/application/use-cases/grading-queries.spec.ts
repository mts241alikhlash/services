import { ConflictException, NotFoundException } from '@nestjs/common'
import {
  STAFF,
  SEMESTER_ID,
  SUBJECT_ID,
  CLASSROOM_7A,
  TEACHER,
  build,
  paperWithManual,
  submitted,
} from '../exam-grading.test-support.js'
import { GetGradingSessionUseCase } from './get-grading-session/get-grading-session.use-case.js'
import { ListGradingSchedulesUseCase } from './list-grading-schedules/list-grading-schedules.use-case.js'
import { ListGradingSessionsUseCase } from './list-grading-sessions/list-grading-sessions.use-case.js'

describe('grading queries', () => {
  const listSchedules = (w: ReturnType<typeof build>) =>
    new ListGradingSchedulesUseCase(
      w.scope,
      w.schedules,
      w.sessions,
      w.academic,
    )
  const listSessions = (w: ReturnType<typeof build>) =>
    new ListGradingSessionsUseCase(w.scope, w.schedules, w.sessions, w.students)
  const getSession = (w: ReturnType<typeof build>) =>
    new GetGradingSessionUseCase(
      w.scope,
      w.schedules,
      w.packages,
      w.questions,
      w.sessions,
      w.students,
    )

  describe('schedules', () => {
    it('lists only the schedules the teacher may grade, with the counts of sessions', async () => {
      const w = build()
      const { schedule, questionIds } = await paperWithManual(w)
      submitted(w, schedule, { [questionIds[1]]: { text: 'jawab' } })
      w.sessions.sessions.set('done', {
        ...w.sessions.sessions.get('ses-1')!,
        id: 'done',
        studentId: 'other',
        status: 'GRADED',
      })

      const page = await listSchedules(w).execute(TEACHER, {
        page: 1,
        limit: 10,
      })

      expect(page.total).toBe(1)
      expect(page.data[0]).toMatchObject({
        id: schedule.id,
        subjectId: SUBJECT_ID,
        classroomName: CLASSROOM_7A.name,
        sessions: 2,
        awaitingGrading: 1,
        graded: 1,
      })
    })

    it('hides schedules of a subject or classroom the teacher does not teach', async () => {
      const w = build({
        taught: [{ subjectId: 'other-subject', classroomId: CLASSROOM_7A.id }],
      })
      const { schedule, questionIds } = await paperWithManual(w)
      submitted(w, schedule, { [questionIds[1]]: { text: 'jawab' } })

      expect(
        (await listSchedules(w).execute(TEACHER, { page: 1, limit: 10 })).total,
      ).toBe(0)
    })

    it('shows every schedule with sessions to manage-all', async () => {
      const w = build({ taught: [], employee: null })
      const { schedule, questionIds } = await paperWithManual(w)
      submitted(w, schedule, { [questionIds[1]]: { text: 'jawab' } })

      expect(
        (await listSchedules(w).execute(STAFF, { page: 1, limit: 10 })).total,
      ).toBe(1)
    })

    it('leaves out schedules nobody started', async () => {
      const w = build()
      await paperWithManual(w)

      expect(
        (await listSchedules(w).execute(TEACHER, { page: 1, limit: 10 })).total,
      ).toBe(0)
    })

    it('uses the semester asked for, else the active one', async () => {
      const w = build()
      const { schedule, questionIds } = await paperWithManual(w)
      submitted(w, schedule, { [questionIds[1]]: { text: 'jawab' } })

      expect(
        (
          await listSchedules(w).execute(TEACHER, {
            page: 1,
            limit: 10,
            semesterId: SEMESTER_ID,
          })
        ).total,
      ).toBe(1)
      expect(
        (
          await listSchedules(w).execute(TEACHER, {
            page: 1,
            limit: 10,
            semesterId: 'sem-other',
          })
        ).total,
      ).toBe(0)
    })
  })

  describe('sessions of a schedule', () => {
    it('lists sessions with the student name, nis and publication state', async () => {
      const w = build()
      const { schedule, questionIds } = await paperWithManual(w)
      submitted(w, schedule, { [questionIds[1]]: { text: 'jawab' } })

      const page = await listSessions(w).execute(TEACHER, schedule.id, {
        page: 1,
        limit: 10,
      })

      expect(page.data[0]).toMatchObject({
        sessionId: 'ses-1',
        studentName: 'Ahmad Fauzi',
        studentNis: '2024001',
        status: 'SUBMITTED',
        awaitingGrading: true,
        publication: null,
      })
    })

    it('keeps the row when the student is missing from student-service', async () => {
      const w = build()
      w.students.refsByIds = () => Promise.resolve([])
      const { schedule, questionIds } = await paperWithManual(w)
      submitted(w, schedule, { [questionIds[1]]: { text: 'jawab' } })

      const page = await listSessions(w).execute(TEACHER, schedule.id, {
        page: 1,
        limit: 10,
      })

      expect(page.data[0]).toMatchObject({
        studentName: null,
        studentNis: null,
      })
    })

    it('answers 404 for a schedule outside the scope and for an unknown one', async () => {
      const w = build({ taught: [] })
      const { schedule } = await paperWithManual(w)

      await expect(
        listSessions(w).execute(TEACHER, schedule.id, { page: 1, limit: 10 }),
      ).rejects.toThrow(NotFoundException)
      await expect(
        listSessions(w).execute(TEACHER, 'missing', { page: 1, limit: 10 }),
      ).rejects.toThrow(NotFoundException)
    })

    it('filters by status', async () => {
      const w = build()
      const { schedule, questionIds } = await paperWithManual(w)
      submitted(w, schedule, { [questionIds[1]]: { text: 'jawab' } })

      const page = await listSessions(w).execute(TEACHER, schedule.id, {
        page: 1,
        limit: 10,
        status: 'GRADED',
      })

      expect(page.total).toBe(0)
    })
  })

  describe('one session', () => {
    it('shows only the manual items in paper order with the reference for the grader', async () => {
      const w = build()
      const { schedule, questionIds } = await paperWithManual(w)
      const [, essay, short] = questionIds
      submitted(w, schedule, {
        [essay]: { text: 'uraian siswa' },
        [short]: { text: 'Bandung' },
      })

      const detail = await getSession(w).execute(TEACHER, 'ses-1')

      expect(detail.items.map((item) => item.questionId)).toEqual([
        essay,
        short,
      ])
      expect(detail.items[0]).toMatchObject({
        number: 2,
        type: 'ESSAY',
        points: 10,
        guideHtml: '<p>Pedoman</p>',
        acceptedAnswers: null,
        answer: { text: 'uraian siswa' },
        score: null,
        needsGrading: true,
      })
      expect(detail.items[1]).toMatchObject({
        number: 3,
        acceptedAnswers: ['jakarta'],
        needsGrading: true,
      })
      expect(detail.session).toMatchObject({
        sessionId: 'ses-1',
        studentName: 'Ahmad Fauzi',
      })
    })

    it('does not ask for grading of a blank or missing answer', async () => {
      const w = build()
      const { schedule, questionIds } = await paperWithManual(w)
      submitted(w, schedule, { [questionIds[1]]: { text: '  ' } })

      const detail = await getSession(w).execute(TEACHER, 'ses-1')

      expect(detail.items.map((item) => item.needsGrading)).toEqual([
        false,
        false,
      ])
    })

    it('answers 404 outside the scope and for an unknown session', async () => {
      const w = build({ taught: [] })
      const { schedule, questionIds } = await paperWithManual(w)
      submitted(w, schedule, { [questionIds[1]]: { text: 'jawab' } })

      await expect(getSession(w).execute(TEACHER, 'ses-1')).rejects.toThrow(
        NotFoundException,
      )
      await expect(getSession(w).execute(TEACHER, 'missing')).rejects.toThrow(
        NotFoundException,
      )
    })

    it('refuses a session still in progress', async () => {
      const w = build()
      const { schedule } = await paperWithManual(w)
      submitted(w, schedule, {}, { status: 'IN_PROGRESS' })

      await expect(getSession(w).execute(TEACHER, 'ses-1')).rejects.toThrow(
        ConflictException,
      )
    })
  })
})
