import { HttpReferenceLookupAdapter } from './http-reference-lookup.adapter.js'
import type { ServiceClient } from '../service-client/service-client.js'

function build(data: unknown) {
  const client = {
    getData: jest.fn().mockResolvedValue(data),
    malformed: jest.fn().mockImplementation(() => {
      throw new Error('malformed')
    }),
  }
  return {
    client,
    adapter: new HttpReferenceLookupAdapter(client as unknown as ServiceClient),
  }
}

const semester = (
  sequence: number,
  start: string | null,
  end: string | null,
) => ({
  id: `s${sequence}`,
  academicYearId: 'y1',
  academicYearName: '2027/2028',
  sequence,
  isActive: false,
  startDate: start,
  endDate: end,
})

describe('HttpReferenceLookupAdapter.firstSemesterOf', () => {
  it('picks the lowest sequence and returns its dates and the year name', async () => {
    const { adapter, client } = build([
      semester(2, '2027-01-04', '2027-06-19'),
      semester(1, '2026-07-13', '2026-12-19'),
    ])

    const timeline = await adapter.firstSemesterOf('y1')

    expect(client.getData).toHaveBeenCalledWith(
      'ACADEMIC_SERVICE_URL',
      '/semesters/by-academic-year/y1',
    )
    expect(timeline).toEqual({
      yearId: 'y1',
      yearName: '2027/2028',
      startDate: new Date('2026-07-13'),
      endDate: new Date('2026-12-19'),
    })
  })

  it('keeps a missing date as null', async () => {
    const { adapter } = build([semester(1, '2026-07-13', null)])

    await expect(adapter.firstSemesterOf('y1')).resolves.toMatchObject({
      startDate: new Date('2026-07-13'),
      endDate: null,
    })
  })

  it('answers null when the year has no semesters', async () => {
    const { adapter } = build([])

    await expect(adapter.firstSemesterOf('y1')).resolves.toBeNull()
  })

  it('refuses a malformed answer', async () => {
    const { adapter, client } = build([{ id: 's1' }])

    await expect(adapter.firstSemesterOf('y1')).rejects.toThrow('malformed')
    expect(client.malformed).toHaveBeenCalledWith('ACADEMIC_SERVICE_URL')
  })
})
