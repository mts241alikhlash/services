import { HttpReferenceLookupAdapter } from './http-reference-lookup.adapter.js'

function adapter(client: Record<string, jest.Mock>) {
  return new HttpReferenceLookupAdapter(client as never)
}

describe('HttpReferenceLookupAdapter grades', () => {
  it('lists the active grades from academic-service', async () => {
    const getData = jest.fn().mockResolvedValue([
      { id: 'g7', level: 7, name: 'Kelas 7' },
      { id: 'g8', level: 8, name: null },
    ])

    await expect(
      adapter({ getData, malformed: jest.fn() }).activeGrades(),
    ).resolves.toEqual([
      { id: 'g7', level: 7, name: 'Kelas 7' },
      { id: 'g8', level: 8, name: null },
    ])
    expect(getData).toHaveBeenCalledWith(
      'ACADEMIC_SERVICE_URL',
      '/grades/active',
    )
  })

  it('refuses a malformed grade row instead of returning a partial list', async () => {
    const malformed = jest.fn().mockImplementation(() => {
      throw new Error('malformed')
    })
    const getData = jest.fn().mockResolvedValue([{ id: 'g7', level: 'seven' }])

    await expect(
      adapter({ getData, malformed }).activeGrades(),
    ).rejects.toThrow('malformed')
  })

  it('looks grades up by id and skips the call for no ids', async () => {
    const postData = jest
      .fn()
      .mockResolvedValue([{ id: 'g7', level: 7, name: 'Kelas 7' }])
    const lookup = adapter({ postData, malformed: jest.fn() })

    await expect(lookup.listGrades(['g7', 'g7'])).resolves.toEqual([
      { id: 'g7', level: 7, name: 'Kelas 7' },
    ])
    expect(postData).toHaveBeenCalledWith(
      'ACADEMIC_SERVICE_URL',
      '/grades/by-ids',
      { ids: ['g7'] },
    )
    await expect(lookup.listGrades([])).resolves.toEqual([])
    expect(postData).toHaveBeenCalledTimes(1)
  })
})
