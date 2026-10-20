import { withDueDates } from './late-due-dates.js'

const required = { id: 'kk', requirement: 'REQUIRED', lateDueMonths: null }
const later = { id: 'ijazah', requirement: 'LATER', lateDueMonths: 2 }

function lookup(result: unknown) {
  return {
    firstSemesterOf: jest
      .fn()
      .mockImplementation(() =>
        result instanceof Error
          ? Promise.reject(result)
          : Promise.resolve(result),
      ),
  }
}

describe('withDueDates', () => {
  it('gives a LATER type the limit date of its year and no one else', async () => {
    const port = lookup({
      yearId: 'y1',
      yearName: '2027/2028',
      startDate: new Date('2026-07-13'),
      endDate: new Date('2026-12-19'),
    })

    const result = await withDueDates([required, later], 'y1', port as never)

    expect(port.firstSemesterOf).toHaveBeenCalledWith('y1')
    expect(result).toEqual([
      { ...required, dueDate: null },
      { ...later, dueDate: '2026-09-13T16:59:59.999Z' },
    ])
  })

  it('does not call academic-service when no type is LATER', async () => {
    const port = lookup(null)

    const result = await withDueDates([required], 'y1', port as never)

    expect(port.firstSemesterOf).not.toHaveBeenCalled()
    expect(result).toEqual([{ ...required, dueDate: null }])
  })

  it('answers null dates when the year has no start date or no semester', async () => {
    const noStart = lookup({
      yearId: 'y1',
      yearName: null,
      startDate: null,
      endDate: null,
    })
    const noSemester = lookup(null)

    expect(
      (await withDueDates([later], 'y1', noStart as never))[0].dueDate,
    ).toBeNull()
    expect(
      (await withDueDates([later], 'y1', noSemester as never))[0].dueDate,
    ).toBeNull()
  })

  it('answers null dates, not an error, when the lookup fails', async () => {
    const port = lookup(new Error('academic down'))

    await expect(withDueDates([later], 'y1', port as never)).resolves.toEqual([
      { ...later, dueDate: null },
    ])
  })

  it('answers null dates when the wave year is unknown', async () => {
    const port = lookup(null)

    const result = await withDueDates([later], undefined, port as never)

    expect(port.firstSemesterOf).not.toHaveBeenCalled()
    expect(result[0].dueDate).toBeNull()
  })
})
