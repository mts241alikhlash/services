import { NisPolicyError, planNis, schoolYearCode } from './nis-number.policy.js'

const candidate = (
  applicationId: string,
  fullName: string,
  gradeLevel: number | null = 7,
  currentNis: string | null = null,
  registrationNumber = `G1-${applicationId}`,
) => ({ applicationId, fullName, registrationNumber, gradeLevel, currentNis })

describe('schoolYearCode', () => {
  it.each([
    ['2026/2027', '2627'],
    ['2026 - 2027', '2627'],
    ['TA 2025/2026 Ganjil', '2526'],
  ])('reads %s as %s', (name, code) => {
    expect(schoolYearCode(name)).toBe(code)
  })

  it.each(['Ganjil', '2026', ''])('refuses %j', (name) => {
    expect(() => schoolYearCode(name)).toThrow(
      new NisPolicyError('Nama tahun ajaran tidak bisa dibaca untuk NIS'),
    )
  })
})

describe('planNis before the lock', () => {
  it('numbers everybody in one alphabetical sequence across grade levels', () => {
    const plan = planNis({
      yearCode: '2627',
      locked: false,
      candidates: [
        candidate('c', 'Citra', 7),
        candidate('a', 'Ahmad', 7),
        candidate('b', 'Budi', 8),
      ],
    })

    expect(plan.assignments).toEqual([
      { applicationId: 'a', nis: '262707001', previous: null },
      { applicationId: 'b', nis: '262708002', previous: null },
      { applicationId: 'c', nis: '262707003', previous: null },
    ])
    expect(plan.created).toBe(3)
    expect(plan.changes).toBe(0)
  })

  it('orders without regard to case and spacing, and breaks a tie by registration number', () => {
    const plan = planNis({
      yearCode: '2627',
      locked: false,
      candidates: [
        candidate('x2', ' budi', 7, null, 'G1-0002'),
        candidate('x1', 'Budi', 7, null, 'G1-0001'),
        candidate('a', 'ahmad', 7),
      ],
    })

    expect(plan.assignments.map((a) => a.applicationId)).toEqual([
      'a',
      'x1',
      'x2',
    ])
  })

  it('keeps the same name in two grade levels apart with its registration number', () => {
    const plan = planNis({
      yearCode: '2627',
      locked: false,
      candidates: [
        candidate('x2', 'Budi', 8, null, 'G1-0002'),
        candidate('x1', 'Budi', 7, null, 'G1-0001'),
      ],
    })

    expect(plan.assignments).toEqual([
      { applicationId: 'x1', nis: '262707001', previous: null },
      { applicationId: 'x2', nis: '262708002', previous: null },
    ])
  })

  it('treats an accent-only difference as a tie broken by registration number', () => {
    const plan = planNis({
      yearCode: '2627',
      locked: false,
      candidates: [
        candidate('b', 'Eka', 7, null, 'G1-0002'),
        candidate('a', 'Éka', 7, null, 'G1-0001'),
      ],
    })

    expect(plan.assignments.map((a) => a.applicationId)).toEqual(['a', 'b'])
  })

  it('uses Indonesian collation so accented names sort with their letter', () => {
    const plan = planNis({
      yearCode: '2627',
      locked: false,
      candidates: [
        candidate('z', 'Zaki'),
        candidate('e', 'Éka'),
        candidate('f', 'Fajar'),
      ],
    })

    expect(plan.assignments.map((a) => a.applicationId)).toEqual([
      'e',
      'f',
      'z',
    ])
  })

  it('counts a number that changes and keeps one that does not', () => {
    const plan = planNis({
      yearCode: '2627',
      locked: false,
      candidates: [
        candidate('a', 'Ahmad', 7, '262707001'),
        candidate('b', 'Budi', 7, '262707009'),
      ],
    })

    expect(plan.changes).toBe(1)
    expect(plan.created).toBe(0)
    expect(plan.assignments).toEqual([
      { applicationId: 'a', nis: '262707001', previous: '262707001' },
      { applicationId: 'b', nis: '262707002', previous: '262707009' },
    ])
  })

  it('is the same on every run', () => {
    const input = {
      yearCode: '2627',
      locked: false,
      candidates: [candidate('b', 'Budi'), candidate('a', 'Ahmad')],
    }

    expect(planNis(input)).toEqual(planNis(input))
  })

  it('skips an applicant without a grade level and says why', () => {
    const plan = planNis({
      yearCode: '2627',
      locked: false,
      candidates: [candidate('a', 'Ahmad', null), candidate('b', 'Budi', 7)],
    })

    expect(plan.skipped).toEqual([
      { applicationId: 'a', reason: 'Tingkat kelas belum diisi' },
    ])
    expect(plan.assignments).toEqual([
      { applicationId: 'b', nis: '262707001', previous: null },
    ])
  })

  it('refuses more than 999 students in a year', () => {
    const candidates = Array.from({ length: 1000 }, (_, index) =>
      candidate(`s${index}`, `Santri ${String(index).padStart(4, '0')}`),
    )

    expect(() =>
      planNis({ yearCode: '2627', locked: false, candidates }),
    ).toThrow(new NisPolicyError('Urutan NIS melebihi 999'))
  })
})

describe('planNis after the lock', () => {
  it('keeps every existing number and numbers the late ones after the largest', () => {
    const plan = planNis({
      yearCode: '2627',
      locked: true,
      candidates: [
        candidate('a', 'Ahmad', 7, '262707001'),
        candidate('c', 'Citra', 7, '262707120'),
        candidate('z', 'Zaki', 8),
        candidate('b', 'Budi', 7),
      ],
    })

    expect(plan.assignments).toEqual([
      { applicationId: 'b', nis: '262707121', previous: null },
      { applicationId: 'z', nis: '262708122', previous: null },
    ])
    expect(plan.changes).toBe(0)
    expect(plan.created).toBe(2)
  })

  it('starts at 001 when nobody has a number yet', () => {
    const plan = planNis({
      yearCode: '2627',
      locked: true,
      candidates: [candidate('b', 'Budi', 9), candidate('a', 'Ahmad', 7)],
    })

    expect(plan.assignments.map((a) => a.nis)).toEqual([
      '262707001',
      '262709002',
    ])
  })

  it('refuses to run past 999 after the lock too', () => {
    expect(() =>
      planNis({
        yearCode: '2627',
        locked: true,
        candidates: [
          candidate('a', 'Ahmad', 7, '262707999'),
          candidate('b', 'Budi', 7),
        ],
      }),
    ).toThrow(new NisPolicyError('Urutan NIS melebihi 999'))
  })
})
