import { PrismaAdmissionEnrolmentRepository } from './prisma-admission-enrolment.repository.js'

const scope = { deletedAt: null }

function queueRepository(counts = [3, 2, 1, 4]) {
  const findMany = jest.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([])
  const count = jest.fn()
  counts.forEach((value) => count.mockResolvedValueOnce(value))
  count.mockResolvedValue(0)
  const prisma = {
    admissionApplication: { findMany, count },
    admissionNisLock: { findMany: jest.fn().mockResolvedValue([]) },
  }
  return {
    repository: new PrismaAdmissionEnrolmentRepository(prisma as never),
    findMany,
    count,
    prisma,
  }
}

describe('PrismaAdmissionEnrolmentRepository.findQueue', () => {
  it('maps the tabs to statuses', async () => {
    const wheres: unknown[] = []
    for (const tab of ['ready', 'held', 'done'] as const) {
      const { repository, findMany } = queueRepository()
      await repository.findQueue({ tab, page: 1, limit: 20 })
      wheres.push((findMany.mock.calls[0][0] as { where: unknown }).where)
    }

    expect(wheres).toEqual([
      { AND: [scope, { status: 'ACCEPTED' }] },
      { AND: [scope, { status: 'ENROLLING' }] },
      { AND: [scope, { status: 'ENROLLED' }] },
    ])
  })

  it('orders ready applicants by name and pages them', async () => {
    const { repository, findMany } = queueRepository()

    await repository.findQueue({ tab: 'ready', page: 3, limit: 20 })

    expect(findMany.mock.calls[0][0]).toMatchObject({
      orderBy: [{ fullName: 'asc' }, { registrationNumber: 'asc' }],
      skip: 40,
      take: 20,
    })
  })

  it('filters by wave and a literal search', async () => {
    const { repository, findMany } = queueRepository()

    await repository.findQueue({
      tab: 'ready',
      search: ' 5%_\\ ',
      waveId: 'w1',
      page: 1,
      limit: 20,
    })

    const where = (findMany.mock.calls[0][0] as { where: { AND: unknown[] } })
      .where
    expect(where.AND[0]).toEqual({
      deletedAt: null,
      waveId: 'w1',
      OR: [
        { fullName: { contains: '5\\%\\_\\\\', mode: 'insensitive' } },
        {
          registrationNumber: { contains: '5\\%\\_\\\\', mode: 'insensitive' },
        },
      ],
    })
  })

  it('maps rows, counts the tabs and reports the lock of every year with accepted applicants', async () => {
    const { repository, findMany, prisma } = queueRepository([5, 3, 1, 1])
    findMany.mockReset()
    findMany
      .mockResolvedValueOnce([
        {
          id: 'app1',
          registrationNumber: 'G1-0001',
          fullName: 'Ahmad',
          status: 'ACCEPTED',
          admissionType: 'NEW',
          targetGradeLevel: 7,
          nis: '262707001',
          nisn: '0091234567',
          enrolledStudentId: null,
          wave: { name: 'Gelombang 1', academicYearId: 'y1' },
        },
      ])
      .mockResolvedValueOnce([
        { wave: { academicYearId: 'y1' } },
        { wave: { academicYearId: 'y1' } },
      ])
    prisma.admissionNisLock.findMany.mockResolvedValue([
      { academicYearId: 'y1', lockedAt: new Date('2026-10-05T00:00:00Z') },
    ])

    const result = await repository.findQueue({
      tab: 'ready',
      page: 1,
      limit: 20,
    })

    expect(result.records).toEqual([
      {
        applicationId: 'app1',
        registrationNumber: 'G1-0001',
        applicantName: 'Ahmad',
        waveName: 'Gelombang 1',
        academicYearId: 'y1',
        status: 'ACCEPTED',
        admissionType: 'NEW',
        targetGradeLevel: 7,
        nis: '262707001',
        nisn: '0091234567',
        enrolledStudentId: null,
      },
    ])
    expect(result.total).toBe(5)
    expect(result.counts).toEqual({ ready: 3, held: 1, done: 1 })
    expect(result.years).toEqual([
      { academicYearId: 'y1', lockedAt: new Date('2026-10-05T00:00:00Z') },
    ])
  })
})

describe('PrismaAdmissionEnrolmentRepository NIS', () => {
  it('reads the candidates of a school year in the three enrolment statuses', async () => {
    const findMany = jest.fn().mockResolvedValue([
      {
        id: 'a',
        fullName: 'Ahmad',
        registrationNumber: 'G1-0001',
        status: 'ENROLLED',
        targetGradeLevel: 7,
        nis: '262707001',
        enrolledStudentId: 's1',
      },
    ])
    const repository = new PrismaAdmissionEnrolmentRepository({
      admissionApplication: { findMany },
    } as never)

    await expect(repository.findNisCandidates('y1')).resolves.toEqual([
      {
        applicationId: 'a',
        fullName: 'Ahmad',
        registrationNumber: 'G1-0001',
        status: 'ENROLLED',
        gradeLevel: 7,
        currentNis: '262707001',
        studentId: 's1',
      },
    ])
    expect(findMany.mock.calls[0][0]).toMatchObject({
      where: {
        deletedAt: null,
        status: { in: ['ACCEPTED', 'ENROLLING', 'ENROLLED'] },
        wave: { academicYearId: 'y1' },
      },
    })
  })

  it('frees every number that moves before it assigns the new ones, in one transaction', async () => {
    const calls: unknown[] = []
    const tx = {
      admissionApplication: {
        updateMany: jest.fn((arg) => {
          calls.push(['clear', arg])
          return Promise.resolve({ count: 2 })
        }),
        update: jest.fn((arg) => {
          calls.push(['set', arg])
          return Promise.resolve({})
        }),
      },
    }
    const repository = new PrismaAdmissionEnrolmentRepository({
      $transaction: (run: (client: unknown) => unknown) => run(tx),
    } as never)

    await repository.writeNis([
      { applicationId: 'a', nis: '262707002' },
      { applicationId: 'b', nis: '262707001' },
    ])

    expect(calls).toEqual([
      ['clear', { where: { id: { in: ['a', 'b'] } }, data: { nis: null } }],
      ['set', { where: { id: 'a' }, data: { nis: '262707002' } }],
      ['set', { where: { id: 'b' }, data: { nis: '262707001' } }],
    ])
  })

  it('does nothing for no changes', async () => {
    const transaction = jest.fn()
    const repository = new PrismaAdmissionEnrolmentRepository({
      $transaction: transaction,
    } as never)

    await repository.writeNis([])

    expect(transaction).not.toHaveBeenCalled()
  })

  it('reports a lock and creates it once', async () => {
    const findUnique = jest
      .fn()
      .mockResolvedValueOnce({ id: 'l1' })
      .mockResolvedValueOnce(null)
    const create = jest
      .fn()
      .mockResolvedValue({ lockedAt: new Date('2026-10-08T00:00:00Z') })
    const repository = new PrismaAdmissionEnrolmentRepository({
      admissionNisLock: { findUnique, create },
    } as never)

    await expect(repository.isNisLocked('y1')).resolves.toBe(true)
    await expect(repository.isNisLocked('y1')).resolves.toBe(false)
    await expect(repository.lockNis('y1', 'admin1')).resolves.toEqual({
      lockedAt: new Date('2026-10-08T00:00:00Z'),
    })
    expect(create).toHaveBeenCalledWith({
      data: { academicYearId: 'y1', lockedById: 'admin1' },
      select: { lockedAt: true },
    })
  })

  it('answers null when two people lock at once', async () => {
    const create = jest
      .fn()
      .mockRejectedValue(Object.assign(new Error('unique'), { code: 'P2002' }))
    const repository = new PrismaAdmissionEnrolmentRepository({
      admissionNisLock: { create },
    } as never)

    await expect(repository.lockNis('y1', 'admin1')).resolves.toBeNull()
  })
})

describe('PrismaAdmissionEnrolmentRepository placement and processing', () => {
  it('reads the placement state with the school year of the wave', async () => {
    const findFirst = jest.fn().mockResolvedValue({
      status: 'ACCEPTED',
      nis: '262707001',
      targetGradeLevel: 7,
      wave: { academicYearId: 'y1' },
    })
    const repository = new PrismaAdmissionEnrolmentRepository({
      admissionApplication: { findFirst },
    } as never)

    await expect(repository.findPlacementState('app1')).resolves.toEqual({
      status: 'ACCEPTED',
      nis: '262707001',
      targetGradeLevel: 7,
      academicYearId: 'y1',
    })
  })

  it('stores the placement and clears the NIS only when asked', async () => {
    const update = jest.fn().mockResolvedValue({})
    const repository = new PrismaAdmissionEnrolmentRepository({
      admissionApplication: { update },
    } as never)
    const placement = {
      admissionType: 'TRANSFER' as const,
      targetGradeId: 'g8',
      targetGradeLevel: 8,
    }

    await repository.setPlacement('app1', placement, true)
    await repository.setPlacement('app1', placement, false)

    expect(update.mock.calls[0][0]).toEqual({
      where: { id: 'app1' },
      data: { ...placement, nis: null },
    })
    expect(update.mock.calls[1][0]).toEqual({
      where: { id: 'app1' },
      data: placement,
    })
  })

  it('reads what processing needs', async () => {
    const findFirst = jest.fn().mockResolvedValue({
      status: 'ACCEPTED',
      nis: '262707001',
      nisn: '0091234567',
      targetGradeId: 'g7',
    })
    const repository = new PrismaAdmissionEnrolmentRepository({
      admissionApplication: { findFirst },
    } as never)

    await expect(repository.findProcessState('app1')).resolves.toEqual({
      status: 'ACCEPTED',
      nis: '262707001',
      nisn: '0091234567',
      targetGradeId: 'g7',
    })
    expect(findFirst).toHaveBeenCalledWith({
      where: { id: 'app1', deletedAt: null },
      select: { status: true, nis: true, nisn: true, targetGradeId: true },
    })
  })
})

describe('PrismaAdmissionEnrolmentRepository.setNisn', () => {
  it('stores the NISN of an application', async () => {
    const update = jest.fn().mockResolvedValue({})
    const repository = new PrismaAdmissionEnrolmentRepository({
      admissionApplication: { update },
    } as never)

    await repository.setNisn('app1', '0099999999')

    expect(update).toHaveBeenCalledWith({
      where: { id: 'app1' },
      data: { nisn: '0099999999' },
    })
  })
})
