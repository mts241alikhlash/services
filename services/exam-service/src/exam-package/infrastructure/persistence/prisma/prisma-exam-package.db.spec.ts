import { randomUUID } from 'node:crypto'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import { PrismaExamScheduleRepository } from '../../../../exam-schedule/infrastructure/persistence/prisma/prisma-exam-schedule.repository.js'
import { PrismaQuestionRepository } from '../../../../question/infrastructure/persistence/prisma/prisma-question.repository.js'
import type { NewQuestionInput } from '../../../../question/domain/repositories/question.repository.js'
import { PrismaExamPackageRepository } from './prisma-exam-package.repository.js'

const enabled = process.env.EXAM_DB_TESTS === '1'
const suite = enabled ? describe : describe.skip

suite('Prisma exam packages against a real database', () => {
  const prisma = new PrismaService({
    get: (key: string) => process.env[key],
  } as unknown as ConfigService)
  const packages = new PrismaExamPackageRepository(prisma)
  const questions = new PrismaQuestionRepository(prisma)
  const schedules = new PrismaExamScheduleRepository(prisma)

  const id = () => randomUUID()
  const subjectId = id()
  const gradeId = id()
  const userId = id()
  const employeeId = id()
  const packageIds: string[] = []
  const scheduleIds: string[] = []

  const draft = { expected: 'DRAFT', next: 'DRAFT' } as const

  const question = (
    packageId: string,
    bodyHtml = '<p>Bumi bulat</p>',
    lineage: Partial<NewQuestionInput> = {},
  ): NewQuestionInput => ({
    packageId,
    subjectId,
    gradeId,
    authorEmployeeId: employeeId,
    type: 'TRUE_FALSE',
    createdById: userId,
    bodyHtml,
    content: { answer: { value: true } },
    points: 2,
    ...lineage,
  })

  async function newPackage(createdById = userId) {
    const created = await packages.create({
      title: 'UTS DB',
      subjectId,
      gradeId,
      createdById,
      items: [],
    })
    packageIds.push(created.id)
    return created
  }

  afterAll(async () => {
    await prisma.examSchedule.deleteMany({ where: { id: { in: scheduleIds } } })
    await prisma.examPackageReview.deleteMany({
      where: { packageId: { in: packageIds } },
    })
    await prisma.examPackageItem.deleteMany({
      where: { packageId: { in: packageIds } },
    })
    await prisma.questionVersion.deleteMany({
      where: { question: { packageId: { in: packageIds } } },
    })
    await prisma.question.deleteMany({
      where: { packageId: { in: packageIds } },
    })
    await prisma.examPackage.deleteMany({ where: { id: { in: packageIds } } })
    await prisma.$disconnect()
  })

  it('adds questions with their lineage at the end of the package', async () => {
    const pkg = await newPackage()
    const source = id()

    const first = await packages.addQuestions(pkg.id, draft, [
      question(pkg.id),
      question(pkg.id, '<p>Salinan</p>', {
        copiedFromQuestionId: source,
        copiedFromVersion: 3,
      }),
    ])
    const second = await packages.addQuestion(pkg.id, draft, question(pkg.id))

    expect(first?.items.map((item) => item.position)).toEqual([1, 2])
    expect(second?.items.map((item) => item.position)).toEqual([1, 2, 3])
    const copy = await questions.findById(second!.items[1].questionId)
    expect(copy).toMatchObject({
      packageId: pkg.id,
      copiedFromQuestionId: source,
      copiedFromVersion: 3,
      currentVersion: 1,
    })
    expect(copy?.current.bodyHtml).toBe('<p>Salinan</p>')
  })

  it('loses a change made against a status that already moved', async () => {
    const pkg = await newPackage()

    const result = await packages.addQuestion(
      pkg.id,
      { expected: 'SUBMITTED', next: 'SUBMITTED' },
      question(pkg.id),
    )

    expect(result).toBeNull()
    expect((await packages.findById(pkg.id))?.items).toEqual([])
    expect(await prisma.question.count({ where: { packageId: pkg.id } })).toBe(
      0,
    )
  })

  it('changing a question adds a version and moves the pin', async () => {
    const pkg = await newPackage()
    const added = await packages.addQuestion(pkg.id, draft, question(pkg.id))
    const questionId = added!.items[0].questionId

    const changed = await packages.changeQuestion(
      pkg.id,
      draft,
      questionId,
      {
        bodyHtml: '<p>Baru</p>',
        content: { answer: { value: false } },
        points: 3,
      },
      userId,
    )

    expect(changed?.items[0].questionVersion).toBe(2)
    const stored = await questions.findById(questionId)
    expect(stored).toMatchObject({ currentVersion: 2, revision: 2 })
    expect(stored?.current).toMatchObject({ number: 2, points: 3 })
    const pinned = await questions.findPinned([{ questionId, number: 1 }])
    expect(pinned[0].bodyHtml).toBe('<p>Bumi bulat</p>')
  })

  it('removing a question deletes its item and closes the gap', async () => {
    const pkg = await newPackage()
    const added = await packages.addQuestions(pkg.id, draft, [
      question(pkg.id, '<p>1</p>'),
      question(pkg.id, '<p>2</p>'),
      question(pkg.id, '<p>3</p>'),
    ])
    const ids = added!.items.map((item) => item.questionId)

    const removed = await packages.removeQuestion(pkg.id, draft, ids[1])

    expect(
      removed?.items.map((item) => [item.questionId, item.position]),
    ).toEqual([
      [ids[0], 1],
      [ids[2], 2],
    ])
    expect(await questions.findById(ids[1])).toBeNull()
  })

  it('reorders the items without tripping the unique position', async () => {
    const pkg = await newPackage()
    const added = await packages.addQuestions(pkg.id, draft, [
      question(pkg.id, '<p>1</p>'),
      question(pkg.id, '<p>2</p>'),
      question(pkg.id, '<p>3</p>'),
    ])
    const ids = added!.items.map((item) => item.questionId)

    const result = await packages.reorderQuestions(pkg.id, draft, [
      ids[2],
      ids[0],
      ids[1],
    ])

    expect(result?.items.map((item) => item.questionId)).toEqual([
      ids[2],
      ids[0],
      ids[1],
    ])
  })

  it('keeps a review with its notes when a package moves, and moves only once', async () => {
    const pkg = await newPackage()
    const added = await packages.addQuestion(pkg.id, draft, question(pkg.id))
    const questionId = added!.items[0].questionId
    await packages.transition(pkg.id, ['DRAFT'], 'SUBMITTED', {
      action: 'SUBMIT',
      byUserId: userId,
      note: null,
      questionNotes: [],
    })

    const returned = await packages.transition(
      pkg.id,
      ['SUBMITTED'],
      'RETURNED',
      {
        action: 'RETURN',
        byUserId: id(),
        note: 'Perbaiki',
        questionNotes: [{ questionId, note: 'Kuncinya salah' }],
      },
    )
    const again = await packages.transition(pkg.id, ['SUBMITTED'], 'APPROVED', {
      action: 'APPROVE',
      byUserId: id(),
      note: null,
      questionNotes: [],
    })

    expect(returned).toBe(true)
    expect(again).toBe(false)
    expect((await packages.findById(pkg.id))?.status).toBe('RETURNED')
    const reviews = await packages.listReviews(pkg.id)
    expect(reviews.map((review) => review.action)).toEqual(['SUBMIT', 'RETURN'])
    expect(reviews[1].questionNotes).toEqual([
      { questionId, note: 'Kuncinya salah' },
    ])
  })

  it('lists a teacher their own packages and the approved ones of others', async () => {
    const other = id()
    const mine = await newPackage(userId)
    const hidden = await newPackage(other)
    const shown = await newPackage(other)
    await prisma.examPackage.update({
      where: { id: shown.id },
      data: { status: 'APPROVED' },
    })

    const result = await packages.findAll({
      page: 1,
      limit: 100,
      subjectId,
      visibleTo: userId,
    })
    const found = result.data.map((row) => row.id)

    expect(found).toContain(mine.id)
    expect(found).toContain(shown.id)
    expect(found).not.toContain(hidden.id)
  })

  it('renames and deletes only what is not waiting or scheduled', async () => {
    const pkg = await newPackage()

    const renamed = await packages.renamePackage(pkg.id, draft, 'UAS DB')
    expect(renamed?.title).toBe('UAS DB')

    await prisma.examPackage.update({
      where: { id: pkg.id },
      data: { status: 'SUBMITTED' },
    })
    expect(await packages.softDeleteUnscheduled(pkg.id)).toBe(false)

    await prisma.examPackage.update({
      where: { id: pkg.id },
      data: { status: 'APPROVED' },
    })
    expect(await packages.softDeleteUnscheduled(pkg.id)).toBe(true)
    expect(await packages.findById(pkg.id)).toBeNull()
  })

  it('locks an approved package when it is scheduled and refuses a draft', async () => {
    const pkg = await newPackage()
    const window = {
      classroomId: id(),
      semesterId: id(),
      startsAt: new Date('2030-11-02T01:00:00.000Z'),
      endsAt: new Date('2030-11-02T04:00:00.000Z'),
      durationMinutes: 90,
      type: 'UH' as const,
      createdById: userId,
    }

    expect(
      await schedules.createAndLockPackage({ packageId: pkg.id, ...window }),
    ).toBeNull()

    await prisma.examPackage.update({
      where: { id: pkg.id },
      data: { status: 'APPROVED' },
    })
    const created = await schedules.createAndLockPackage({
      packageId: pkg.id,
      ...window,
    })
    scheduleIds.push(created!.id)

    expect((await packages.findById(pkg.id))?.status).toBe('LOCKED')
  })
})
