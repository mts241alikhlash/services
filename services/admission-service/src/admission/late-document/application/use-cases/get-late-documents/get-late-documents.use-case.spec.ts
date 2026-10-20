import { GetLateDocumentsUseCase } from './get-late-documents.use-case.js'
import type { LateDocumentPair } from '../../../domain/late-document.entity.js'

const NOW = new Date('2026-10-01T05:00:00Z')
const timeline = {
  yearId: 'y1',
  yearName: '2027/2028',
  startDate: new Date('2026-07-13'),
  endDate: new Date('2026-12-19'),
}

function pair(
  registrationNumber: string,
  overrides: Partial<LateDocumentPair> = {},
): LateDocumentPair {
  return {
    applicationId: `app-${registrationNumber}`,
    registrationNumber,
    applicantName: `Siswa ${registrationNumber}`,
    applicationStatus: 'ENROLLED',
    waveId: 'w1',
    waveName: 'Gelombang 1',
    gradeLevel: 7,
    documentType: {
      id: 'ijazah',
      code: 'IJAZAH',
      name: 'Ijazah SD',
      lateDueMonths: 2,
    },
    document: null,
    ...overrides,
  }
}

function build(
  pairs: LateDocumentPair[],
  options: { timeline?: unknown; yearId?: string | null } = {},
) {
  const repo = {
    resolvePpdbYearId: jest
      .fn()
      .mockResolvedValue(options.yearId === undefined ? 'y1' : options.yearId),
    findTrackedPairs: jest.fn().mockResolvedValue(pairs),
  }
  const lookup = {
    firstSemesterOf: jest
      .fn()
      .mockResolvedValue(
        options.timeline === undefined ? timeline : options.timeline,
      ),
    listAcademicYears: jest
      .fn()
      .mockResolvedValue([{ id: 'y1', name: '2027/2028' }]),
  }
  return {
    repo,
    lookup,
    useCase: new GetLateDocumentsUseCase(repo as never, lookup as never),
  }
}

describe('GetLateDocumentsUseCase', () => {
  it('defaults to the open states, sorts by urgency then registration number and pages the rows', async () => {
    const { useCase } = build([
      pair('PSB-003', {
        document: {
          id: 'd3',
          fileId: 'f3',
          fileName: 'f3.pdf',
          fileMimeType: 'application/pdf',
          status: 'APPROVED',
          note: null,
        },
      }),
      pair('PSB-002'),
      pair('PSB-001'),
    ])

    const result = await useCase.execute(
      { page: 1, limit: 1 },
      new Date('2026-12-30T00:00:00Z'),
    )

    expect(result.data.map((row) => row.registrationNumber)).toEqual([
      'PSB-001',
    ])
    expect(result.data[0]).toMatchObject({
      state: 'MISSING',
      urgency: 'OVERDUE',
      documentTypeName: 'Ijazah SD',
      gradeLevel: 7,
    })
    expect(result.meta).toMatchObject({
      page: 1,
      limit: 1,
      total: 2,
      totalPages: 2,
    })
  })

  it('counts every tracked pair with the same derivation as the rows', async () => {
    const { useCase } = build([
      pair('PSB-001'),
      pair('PSB-002', {
        document: {
          id: 'd2',
          fileId: 'f2',
          fileName: 'f2.pdf',
          fileMimeType: 'application/pdf',
          status: 'PENDING',
          note: null,
        },
      }),
      pair('PSB-003', {
        document: {
          id: 'd3',
          fileId: 'f3',
          fileName: 'f3.pdf',
          fileMimeType: 'application/pdf',
          status: 'APPROVED',
          note: null,
        },
      }),
    ])

    const result = await useCase.execute({}, new Date('2026-10-01T05:00:00Z'))

    expect(result.meta.counts).toEqual({
      onTime: 0,
      late: 2,
      overdue: 0,
      complete: 1,
    })
    expect(result.data).toHaveLength(2)
    const rowOf = (number: string) =>
      result.data.find((row) => row.registrationNumber === number)
    expect(rowOf('PSB-002')).toMatchObject({
      fileId: 'f2',
      fileName: 'f2.pdf',
      fileMimeType: 'application/pdf',
    })
    expect(rowOf('PSB-001')).toMatchObject({
      fileId: null,
      fileName: null,
      fileMimeType: null,
    })
  })

  it('filters by state, document type, wave and search', async () => {
    const { useCase } = build([
      pair('PSB-001'),
      pair('PSB-002', { waveId: 'w2', waveName: 'Gelombang 2' }),
      pair('PSB-003', {
        documentType: {
          id: 'rapor',
          code: 'RAPOR',
          name: 'Rapor',
          lateDueMonths: 2,
        },
      }),
      pair('PSB-004', {
        applicantName: 'Ahmad Fauzi',
        document: {
          id: 'd4',
          fileId: 'f4',
          fileName: 'f4.pdf',
          fileMimeType: 'application/pdf',
          status: 'APPROVED',
          note: null,
        },
      }),
    ])

    const byWave = await useCase.execute({ waveId: 'w2' }, NOW)
    const byType = await useCase.execute({ documentTypeId: 'rapor' }, NOW)
    const bySearch = await useCase.execute(
      { search: 'ahmad', state: 'APPROVED' },
      NOW,
    )

    expect(byWave.data.map((row) => row.registrationNumber)).toEqual([
      'PSB-002',
    ])
    expect(byType.data.map((row) => row.registrationNumber)).toEqual([
      'PSB-003',
    ])
    expect(bySearch.data.map((row) => row.registrationNumber)).toEqual([
      'PSB-004',
    ])
  })

  it('shows a type switched to LATER later for every tracked application', async () => {
    const { useCase } = build([
      pair('PSB-001'),
      pair('PSB-002', { applicationStatus: 'SUBMITTED' }),
    ])

    const result = await useCase.execute({}, NOW)

    expect(result.data.map((row) => row.state)).toEqual(['MISSING', 'MISSING'])
  })

  it('reports datesMissing and shows no urgency when the semester dates are empty', async () => {
    const { useCase } = build([pair('PSB-001')], {
      timeline: { ...timeline, startDate: null, endDate: null },
    })

    const result = await useCase.execute({}, new Date('2030-01-01T00:00:00Z'))

    expect(result.meta.datesMissing).toEqual(['start', 'end'])
    expect(result.data[0]).toMatchObject({
      urgency: 'ON_TIME',
      limitDate: null,
    })
  })

  it('reports a missing end date only', async () => {
    const { useCase } = build([pair('PSB-001')], {
      timeline: { ...timeline, endDate: null },
    })

    const result = await useCase.execute({}, new Date('2030-01-01T00:00:00Z'))

    expect(result.meta.datesMissing).toEqual(['end'])
    expect(result.data[0].urgency).toBe('LATE')
  })

  it('has no limit date for a LATER type without lateDueMonths', async () => {
    const { useCase } = build([
      pair('PSB-001', {
        documentType: {
          id: 'ijazah',
          code: 'IJAZAH',
          name: 'Ijazah SD',
          lateDueMonths: null,
        },
      }),
    ])

    const result = await useCase.execute({}, new Date('2026-11-01T00:00:00Z'))

    expect(result.data[0]).toMatchObject({
      limitDate: null,
      urgency: 'ON_TIME',
    })
  })

  it('answers an empty list and no year when there is no PPDB year', async () => {
    const { useCase, lookup } = build([], { yearId: null })

    const result = await useCase.execute({}, NOW)

    expect(result.data).toEqual([])
    expect(result.meta.year).toBeNull()
    expect(lookup.firstSemesterOf).not.toHaveBeenCalled()
  })

  it('names the year even when it has no semesters', async () => {
    const { useCase } = build([pair('PSB-001')], { timeline: null })

    const result = await useCase.execute({}, NOW)

    expect(result.meta.year).toEqual({ id: 'y1', name: '2027/2028' })
    expect(result.meta.datesMissing).toEqual(['start', 'end'])
  })

  it('surfaces an academic-service failure instead of an empty list', async () => {
    const { useCase, lookup } = build([pair('PSB-001')])
    lookup.firstSemesterOf.mockRejectedValue(new Error('academic down'))

    await expect(useCase.execute({}, NOW)).rejects.toThrow('academic down')
  })
})
