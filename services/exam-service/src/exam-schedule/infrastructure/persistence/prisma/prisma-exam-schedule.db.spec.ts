import { randomUUID } from 'node:crypto'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import { PrismaExamPackageRepository } from '../../../../exam-package/infrastructure/persistence/prisma/prisma-exam-package.repository.js'
import { PrismaExamScheduleRepository } from './prisma-exam-schedule.repository.js'

const enabled = process.env.EXAM_DB_TESTS === '1'
const suite = enabled ? describe : describe.skip

suite('Prisma makeup schedules against a real database', () => {
  const prisma = new PrismaService({
    get: (key: string) => process.env[key],
  } as unknown as ConfigService)
  const packages = new PrismaExamPackageRepository(prisma)
  const schedules = new PrismaExamScheduleRepository(prisma)

  const id = () => randomUUID()
  const userId = id()
  const classroomId = id()
  const semesterId = id()
  const gradeId = id()
  const subjectId = id()
  const packageIds: string[] = []
  const scheduleIds: string[] = []
  const students = [id(), id(), id()]

  async function approvedPackage() {
    const created = await packages.create({
      title: 'UTS makeup',
      subjectId,
      gradeId,
      createdById: userId,
      items: [],
    })
    packageIds.push(created.id)
    await prisma.examPackage.update({
      where: { id: created.id },
      data: { status: 'APPROVED' },
    })
    return created
  }

  async function original() {
    const pkg = await approvedPackage()
    const created = await schedules.createAndLockPackage({
      packageId: pkg.id,
      classroomId,
      semesterId,
      startsAt: new Date('2026-11-02T01:00:00Z'),
      endsAt: new Date('2026-11-02T03:00:00Z'),
      durationMinutes: 90,
      type: 'UTS',
      createdById: userId,
    })
    if (created === null) throw new Error('package was not lockable')
    scheduleIds.push(created.id)
    return created
  }

  afterAll(async () => {
    await prisma.examScheduleParticipant.deleteMany({
      where: { scheduleId: { in: scheduleIds } },
    })
    await prisma.examSchedule.deleteMany({
      where: { makeupOfId: { in: scheduleIds } },
    })
    await prisma.examSchedule.deleteMany({ where: { id: { in: scheduleIds } } })
    await prisma.examPackage.deleteMany({ where: { id: { in: packageIds } } })
    await prisma.$disconnect()
  })

  it('stores a makeup with its participants in one step', async () => {
    const base = await original()

    const makeup = await schedules.createMakeup({
      packageId: base.packageId,
      classroomId,
      semesterId,
      startsAt: new Date('2026-11-04T01:00:00Z'),
      endsAt: new Date('2026-11-04T03:00:00Z'),
      durationMinutes: 90,
      type: 'UTS',
      createdById: userId,
      makeupOfId: base.id,
      participants: [
        { studentId: students[0], reason: 'SICK', note: 'Demam' },
        { studentId: students[1], reason: 'PERMITTED', note: null },
      ],
    })
    if (makeup === null) throw new Error('makeup was not created')
    scheduleIds.push(makeup.id)

    expect(makeup.kind).toBe('MAKEUP')
    expect(makeup.makeupOfId).toBe(base.id)
    expect(base.kind).toBe('REGULAR')
    const listed = await schedules.listParticipants(makeup.id)
    expect(listed.map((row) => row.studentId).sort()).toEqual(
      [students[0], students[1]].sort(),
    )
    expect(listed.find((row) => row.studentId === students[0])?.note).toBe(
      'Demam',
    )
  })

  it('finds the makeups of an original and the makeups a student is on', async () => {
    const base = await original()
    const makeup = await schedules.createMakeup({
      packageId: base.packageId,
      classroomId,
      semesterId,
      startsAt: new Date('2026-11-04T01:00:00Z'),
      endsAt: new Date('2026-11-04T03:00:00Z'),
      durationMinutes: 90,
      type: 'UTS',
      createdById: userId,
      makeupOfId: base.id,
      participants: [{ studentId: students[2], reason: 'ABSENT', note: null }],
    })
    if (makeup === null) throw new Error('makeup was not created')
    scheduleIds.push(makeup.id)

    expect(
      (await schedules.findMakeupsOf(base.id)).map((row) => row.id),
    ).toEqual([makeup.id])
    expect(
      (await schedules.findMakeupsForStudent(students[2], semesterId)).map(
        (row) => row.id,
      ),
    ).toContain(makeup.id)
    expect(await schedules.findMakeupsForStudent(id(), semesterId)).toEqual([])
    expect(
      (await schedules.findParticipation(makeup.id, students[2]))?.reason,
    ).toBe('ABSENT')
    expect(await schedules.findParticipation(makeup.id, id())).toBeNull()
  })

  it('adds and removes participants and refuses the same student twice', async () => {
    const base = await original()
    const makeup = await schedules.createMakeup({
      packageId: base.packageId,
      classroomId,
      semesterId,
      startsAt: new Date('2026-11-04T01:00:00Z'),
      endsAt: new Date('2026-11-04T03:00:00Z'),
      durationMinutes: 90,
      type: 'UTS',
      createdById: userId,
      makeupOfId: base.id,
      participants: [{ studentId: students[0], reason: 'SICK', note: null }],
    })
    if (makeup === null) throw new Error('makeup was not created')
    scheduleIds.push(makeup.id)

    await schedules.addParticipants(
      makeup.id,
      [{ studentId: students[1], reason: 'OTHER', note: null }],
      userId,
    )
    expect(await schedules.listParticipants(makeup.id)).toHaveLength(2)
    await expect(
      schedules.addParticipants(
        makeup.id,
        [{ studentId: students[1], reason: 'OTHER', note: null }],
        userId,
      ),
    ).rejects.toBeDefined()
    expect(await schedules.removeParticipant(makeup.id, students[1])).toBe(true)
    expect(await schedules.removeParticipant(makeup.id, students[1])).toBe(
      false,
    )
  })

  it('keeps makeups out of the regular listing of a classroom', async () => {
    const base = await original()
    const makeup = await schedules.createMakeup({
      packageId: base.packageId,
      classroomId,
      semesterId,
      startsAt: new Date('2026-11-04T01:00:00Z'),
      endsAt: new Date('2026-11-04T03:00:00Z'),
      durationMinutes: 90,
      type: 'UTS',
      createdById: userId,
      makeupOfId: base.id,
      participants: [{ studentId: students[0], reason: 'SICK', note: null }],
    })
    if (makeup === null) throw new Error('makeup was not created')
    scheduleIds.push(makeup.id)

    const listed = await schedules.findForClassroom(classroomId, semesterId)

    expect(listed.map((row) => row.id)).toContain(base.id)
    expect(listed.map((row) => row.id)).not.toContain(makeup.id)
  })
})
