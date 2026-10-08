import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'
import { ComposeNisUseCase } from './compose-nis/compose-nis.use-case.js'
import { GetEnrolmentQueueUseCase } from './get-enrolment-queue/get-enrolment-queue.use-case.js'
import { LockNisUseCase } from './lock-nis/lock-nis.use-case.js'
import { PreviewNisUseCase } from './preview-nis/preview-nis.use-case.js'
import { ProcessEnrolmentsUseCase } from './process-enrolments/process-enrolments.use-case.js'
import { SetPlacementUseCase } from './set-placement/set-placement.use-case.js'

const candidate = (
  applicationId: string,
  fullName: string,
  overrides: Record<string, unknown> = {},
) => ({
  applicationId,
  fullName,
  registrationNumber: `G1-${applicationId}`,
  status: 'ACCEPTED',
  gradeLevel: 7,
  currentNis: null,
  studentId: null,
  ...overrides,
})

const yearLookup = {
  listAcademicYears: jest
    .fn()
    .mockResolvedValue([{ id: 'y1', name: '2026/2027' }]),
}

describe('GetEnrolmentQueueUseCase', () => {
  it('defaults to Siap diproses and names the school years', async () => {
    const findQueue = jest.fn().mockResolvedValue({
      records: [],
      total: 41,
      counts: { ready: 41, held: 1, done: 2 },
      years: [
        { academicYearId: 'y1', lockedAt: new Date('2026-10-05T00:00:00Z') },
      ],
    })

    const result = await new GetEnrolmentQueueUseCase(
      { findQueue } as never,
      yearLookup as never,
    ).execute({})

    expect(findQueue).toHaveBeenCalledWith({
      tab: 'ready',
      search: undefined,
      waveId: undefined,
      page: 1,
      limit: 20,
    })
    expect(result.meta).toEqual({
      page: 1,
      limit: 20,
      total: 41,
      totalPages: 3,
      counts: { ready: 41, held: 1, done: 2 },
      years: [
        {
          academicYearId: 'y1',
          academicYearName: '2026/2027',
          locked: true,
          lockedAt: new Date('2026-10-05T00:00:00Z'),
        },
      ],
    })
  })
})

describe('SetPlacementUseCase', () => {
  const input = {
    applicationId: 'app1',
    admissionType: 'TRANSFER' as const,
    targetGradeId: 'g8',
  }

  function setup(
    state: unknown,
    locked = false,
    grades = [{ id: 'g8', level: 8, name: 'Kelas 8' }],
  ) {
    const repository = {
      findPlacementState: jest.fn().mockResolvedValue(state),
      isNisLocked: jest.fn().mockResolvedValue(locked),
      setPlacement: jest.fn().mockResolvedValue(undefined),
    }
    const lookup = { listGrades: jest.fn().mockResolvedValue(grades) }
    return {
      repository,
      useCase: new SetPlacementUseCase(repository as never, lookup as never),
    }
  }

  const accepted = {
    status: 'ACCEPTED',
    nis: null,
    targetGradeLevel: null,
    academicYearId: 'y1',
  }

  it('stores the placement with a copy of the level', async () => {
    const { useCase, repository } = setup(accepted)

    await expect(useCase.execute(input)).resolves.toEqual({
      applicationId: 'app1',
      admissionType: 'TRANSFER',
      targetGradeId: 'g8',
      targetGradeLevel: 8,
      nisCleared: false,
    })
    expect(repository.setPlacement).toHaveBeenCalledWith(
      'app1',
      { admissionType: 'TRANSFER', targetGradeId: 'g8', targetGradeLevel: 8 },
      false,
    )
  })

  it('clears an NIS whose grade digits would no longer match', async () => {
    const { useCase, repository } = setup({
      ...accepted,
      nis: '262707001',
      targetGradeLevel: 7,
    })

    await expect(useCase.execute(input)).resolves.toMatchObject({
      nisCleared: true,
    })
    expect(repository.setPlacement).toHaveBeenCalledWith(
      'app1',
      expect.anything(),
      true,
    )
  })

  it('keeps an NIS when the level does not change', async () => {
    const { useCase, repository } = setup({
      ...accepted,
      nis: '262708001',
      targetGradeLevel: 8,
    })

    await expect(useCase.execute(input)).resolves.toMatchObject({
      nisCleared: false,
    })
    expect(repository.setPlacement).toHaveBeenCalledWith(
      'app1',
      expect.anything(),
      false,
    )
  })

  it('refuses to change the level of a numbered applicant after the lock', async () => {
    const { useCase, repository } = setup(
      { ...accepted, nis: '262707001', targetGradeLevel: 7 },
      true,
    )

    await expect(useCase.execute(input)).rejects.toThrow(
      new ConflictException(
        'NIS sudah dikunci, tingkat kelas tidak bisa diubah',
      ),
    )
    expect(repository.setPlacement).not.toHaveBeenCalled()
  })

  it.each(['ENROLLING', 'ENROLLED'])(
    'refuses an applicant that is %s',
    async (status) => {
      const { useCase } = setup({ ...accepted, status })

      await expect(useCase.execute(input)).rejects.toThrow(
        new ConflictException('Pendaftar sudah diproses menjadi santri'),
      )
    },
  )

  it('answers 404 for an unknown applicant and 400 for an unknown grade', async () => {
    await expect(setup(null).useCase.execute(input)).rejects.toBeInstanceOf(
      NotFoundException,
    )
    await expect(
      setup(accepted, false, []).useCase.execute(input),
    ).rejects.toThrow(new BadRequestException('Tingkat kelas tidak ditemukan'))
  })
})

describe('PreviewNisUseCase', () => {
  function setup(candidates: unknown[], locked = false, years = yearLookup) {
    const repository = {
      findNisCandidates: jest.fn().mockResolvedValue(candidates),
      isNisLocked: jest.fn().mockResolvedValue(locked),
    }
    return new PreviewNisUseCase(repository as never, years as never)
  }

  it('shows each number, what it replaces and how many existing numbers change', async () => {
    const result = await setup([
      candidate('b', 'Budi', { currentNis: '262707009' }),
      candidate('a', 'Ahmad', { currentNis: '262707001' }),
    ]).execute('y1')

    expect(result).toMatchObject({
      academicYearId: 'y1',
      academicYearName: '2026/2027',
      locked: false,
      changes: 1,
      created: 0,
      skipped: [],
    })
    expect(result.rows).toEqual([
      {
        applicationId: 'a',
        applicantName: 'Ahmad',
        registrationNumber: 'G1-a',
        gradeLevel: 7,
        previous: '262707001',
        nis: '262707001',
        changed: false,
      },
      {
        applicationId: 'b',
        applicantName: 'Budi',
        registrationNumber: 'G1-b',
        gradeLevel: 7,
        previous: '262707009',
        nis: '262707002',
        changed: true,
      },
    ])
  })

  it('names the applicants that were skipped', async () => {
    const result = await setup([
      candidate('a', 'Ahmad', { gradeLevel: null }),
    ]).execute('y1')

    expect(result.skipped).toEqual([
      {
        applicationId: 'a',
        applicantName: 'Ahmad',
        registrationNumber: 'G1-a',
        reason: 'Tingkat kelas belum diisi',
      },
    ])
  })

  it('answers a clear error for an unknown or unreadable school year', async () => {
    const unknown = { listAcademicYears: jest.fn().mockResolvedValue([]) }
    const unreadable = {
      listAcademicYears: jest
        .fn()
        .mockResolvedValue([{ id: 'y1', name: 'Ganjil' }]),
    }

    await expect(setup([], false, unknown).execute('y1')).rejects.toThrow(
      new BadRequestException('Tahun ajaran tidak ditemukan'),
    )
    await expect(setup([], false, unreadable).execute('y1')).rejects.toThrow(
      new ConflictException('Nama tahun ajaran tidak bisa dibaca untuk NIS'),
    )
  })
})

describe('ComposeNisUseCase', () => {
  function setup(candidates: unknown[], locked = false) {
    const repository = {
      findNisCandidates: jest.fn().mockResolvedValue(candidates),
      isNisLocked: jest.fn().mockResolvedValue(locked),
      writeNis: jest.fn().mockResolvedValue(undefined),
    }
    const enrolment = { updateNis: jest.fn().mockResolvedValue(undefined) }
    return {
      repository,
      enrolment,
      useCase: new ComposeNisUseCase(
        repository as never,
        yearLookup as never,
        enrolment as never,
      ),
    }
  }
  const run = { academicYearId: 'y1', bearerToken: 'tok' }

  it('writes the numbers that change or are new, and nothing else', async () => {
    const { useCase, repository } = setup([
      candidate('a', 'Ahmad', { currentNis: '262707001' }),
      candidate('b', 'Budi'),
    ])

    const result = await useCase.execute({ ...run, expectedChanges: 0 })

    expect(repository.writeNis).toHaveBeenCalledWith([
      { applicationId: 'b', nis: '262707002' },
    ])
    expect(result).toEqual({
      academicYearId: 'y1',
      written: 1,
      created: 1,
      changed: 0,
      failed: [],
    })
  })

  it('refuses when the count of changes is not the one the user confirmed', async () => {
    const { useCase, repository } = setup([
      candidate('a', 'Ahmad', { currentNis: '262707009' }),
    ])

    await expect(
      useCase.execute({ ...run, expectedChanges: 0 }),
    ).rejects.toThrow(
      new ConflictException('Hasil susun NIS berubah, lihat pratinjau lagi'),
    )
    expect(repository.writeNis).not.toHaveBeenCalled()
  })

  it('moves enrolled students in two steps so swapped numbers never collide', async () => {
    const { useCase, enrolment } = setup([
      candidate('a', 'Ahmad', {
        status: 'ENROLLED',
        currentNis: '262707002',
        studentId: 'sa',
      }),
      candidate('b', 'Budi', {
        status: 'ENROLLED',
        currentNis: '262707001',
        studentId: 'sb',
      }),
    ])

    const result = await useCase.execute({ ...run, expectedChanges: 2 })

    const calls = enrolment.updateNis.mock.calls.map(([id, nis]) => [id, nis])
    expect(
      calls.slice(0, 2).every(([, nis]) => String(nis).startsWith('T')),
    ).toBe(true)
    expect(calls.slice(2)).toEqual([
      ['sa', '262707001'],
      ['sb', '262707002'],
    ])
    expect(result.changed).toBe(2)
    expect(result.failed).toEqual([])
  })

  it('reports a student the service refused and still finishes the others', async () => {
    const { useCase, enrolment } = setup([
      candidate('a', 'Ahmad', {
        status: 'ENROLLED',
        currentNis: '262707002',
        studentId: 'sa',
      }),
      candidate('b', 'Budi', {
        status: 'ENROLLED',
        currentNis: '262707001',
        studentId: 'sb',
      }),
    ])
    enrolment.updateNis.mockImplementation((id: string) =>
      id === 'sa' ? Promise.reject(new Error('refused')) : Promise.resolve(),
    )

    const result = await useCase.execute({ ...run, expectedChanges: 2 })

    expect(result.failed).toEqual([
      { applicationId: 'a', reason: 'Gagal memperbarui NIS di data santri' },
    ])
    expect(enrolment.updateNis).toHaveBeenCalledWith('sb', '262707002', 'tok')
  })

  it('pushes every enrolled number again when asked to sync', async () => {
    const { useCase, enrolment } = setup([
      candidate('a', 'Ahmad', {
        status: 'ENROLLED',
        currentNis: '262707001',
        studentId: 'sa',
      }),
    ])

    await useCase.execute({ ...run, expectedChanges: 0, syncStudents: true })

    expect(enrolment.updateNis).toHaveBeenLastCalledWith(
      'sa',
      '262707001',
      'tok',
    )
  })

  it('does not touch students who are not enrolled', async () => {
    const { useCase, enrolment } = setup([candidate('a', 'Ahmad')])

    await useCase.execute({ ...run, expectedChanges: 0 })

    expect(enrolment.updateNis).not.toHaveBeenCalled()
  })

  it('numbers only the late applicants after the lock', async () => {
    const { useCase, repository } = setup(
      [
        candidate('a', 'Ahmad', { currentNis: '262707120' }),
        candidate('z', 'Zaki'),
      ],
      true,
    )

    await useCase.execute({ ...run, expectedChanges: 0 })

    expect(repository.writeNis).toHaveBeenCalledWith([
      { applicationId: 'z', nis: '262707121' },
    ])
  })
})

describe('LockNisUseCase', () => {
  it('locks a year once and says who and when', async () => {
    const lockedAt = new Date('2026-10-08T00:00:00Z')
    const repository = { lockNis: jest.fn().mockResolvedValue({ lockedAt }) }

    await expect(
      new LockNisUseCase(repository as never).execute({
        academicYearId: 'y1',
        lockedById: 'admin1',
      }),
    ).resolves.toEqual({ academicYearId: 'y1', lockedAt })
    expect(repository.lockNis).toHaveBeenCalledWith('y1', 'admin1')
  })

  it('refuses a second lock', async () => {
    const repository = { lockNis: jest.fn().mockResolvedValue(null) }

    await expect(
      new LockNisUseCase(repository as never).execute({
        academicYearId: 'y1',
        lockedById: 'admin1',
      }),
    ).rejects.toThrow(
      new ConflictException('NIS tahun ajaran ini sudah dikunci'),
    )
  })
})

describe('ProcessEnrolmentsUseCase', () => {
  const ready = {
    status: 'ACCEPTED',
    nis: '262707001',
    nisn: '0091234567',
    targetGradeId: 'g7',
  }

  function setup(states: Record<string, unknown>) {
    const repository = {
      findProcessState: jest.fn((id: string) =>
        Promise.resolve(states[id] ?? null),
      ),
    }
    const enroll = { execute: jest.fn().mockResolvedValue({ id: 'x' }) }
    return {
      repository,
      enroll,
      useCase: new ProcessEnrolmentsUseCase(
        repository as never,
        enroll as never,
      ),
    }
  }

  it('enrols each ready applicant with the caller token', async () => {
    const { useCase, enroll } = setup({ a: ready, b: ready })

    const result = await useCase.execute({
      applicationIds: ['a', 'b'],
      bearerToken: 'tok',
    })

    expect(enroll.execute).toHaveBeenCalledTimes(2)
    expect(enroll.execute).toHaveBeenCalledWith(
      'a',
      { nis: '262707001', nisn: '0091234567', gradeId: 'g7' },
      'tok',
    )
    expect(result.results).toEqual([
      { applicationId: 'a', outcome: 'ENROLLED' },
      { applicationId: 'b', outcome: 'ENROLLED' },
    ])
  })

  it('lets TU type a missing NISN', async () => {
    const { useCase, enroll } = setup({ a: { ...ready, nisn: null } })

    await useCase.execute({
      applicationIds: ['a'],
      nisn: [{ applicationId: 'a', nisn: '0099999999' }],
      bearerToken: 'tok',
    })

    expect(enroll.execute).toHaveBeenCalledWith(
      'a',
      expect.objectContaining({ nisn: '0099999999' }),
      'tok',
    )
  })

  it('skips an applicant that cannot be processed and says why, without stopping the others', async () => {
    const { useCase, enroll } = setup({
      ok: ready,
      held: { ...ready, status: 'VERIFIED' },
      nonis: { ...ready, nis: null },
      nograde: { ...ready, targetGradeId: null },
      nonisn: { ...ready, nisn: null },
    })

    const result = await useCase.execute({
      applicationIds: ['held', 'nonis', 'nograde', 'nonisn', 'gone', 'ok'],
      bearerToken: 'tok',
    })

    expect(result.results).toEqual([
      {
        applicationId: 'held',
        outcome: 'SKIPPED',
        reason: 'Pendaftar belum berstatus diterima',
      },
      {
        applicationId: 'nonis',
        outcome: 'SKIPPED',
        reason: 'NIS belum disusun',
      },
      {
        applicationId: 'nograde',
        outcome: 'SKIPPED',
        reason: 'Tingkat kelas tujuan belum diisi',
      },
      {
        applicationId: 'nonisn',
        outcome: 'SKIPPED',
        reason: 'NISN belum diisi',
      },
      {
        applicationId: 'gone',
        outcome: 'SKIPPED',
        reason: 'Pendaftar tidak ditemukan',
      },
      { applicationId: 'ok', outcome: 'ENROLLED' },
    ])
    expect(enroll.execute).toHaveBeenCalledTimes(1)
  })

  it('retries an applicant that was left ENROLLING', async () => {
    const { useCase, enroll } = setup({ a: { ...ready, status: 'ENROLLING' } })

    const result = await useCase.execute({
      applicationIds: ['a'],
      bearerToken: 'tok',
    })

    expect(enroll.execute).toHaveBeenCalledTimes(1)
    expect(result.results[0].outcome).toBe('ENROLLED')
  })

  it('reports a failed enrolment and goes on with the next one', async () => {
    const { useCase, enroll } = setup({ a: ready, b: ready })
    enroll.execute
      .mockRejectedValueOnce(new ConflictException('Duplicate NIS or NISN'))
      .mockResolvedValueOnce({ id: 'b' })

    const result = await useCase.execute({
      applicationIds: ['a', 'b'],
      bearerToken: 'tok',
    })

    expect(result.results).toEqual([
      {
        applicationId: 'a',
        outcome: 'FAILED',
        reason: 'Duplicate NIS or NISN',
      },
      { applicationId: 'b', outcome: 'ENROLLED' },
    ])
  })

  it('collapses duplicate ids and refuses 0 or more than 50', async () => {
    const { useCase, enroll } = setup({ a: ready })

    await useCase.execute({ applicationIds: ['a', 'a'], bearerToken: 'tok' })
    expect(enroll.execute).toHaveBeenCalledTimes(1)

    await expect(
      useCase.execute({ applicationIds: [], bearerToken: 'tok' }),
    ).rejects.toBeInstanceOf(BadRequestException)
    await expect(
      useCase.execute({
        applicationIds: Array.from({ length: 51 }, (_, index) => `id${index}`),
        bearerToken: 'tok',
      }),
    ).rejects.toBeInstanceOf(BadRequestException)
  })
})
