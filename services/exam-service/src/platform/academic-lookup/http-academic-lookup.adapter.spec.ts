import { ServiceUnavailableException } from '@nestjs/common'
import type { ServiceClient } from '../service-client/service-client.js'
import { HttpAcademicLookupAdapter } from './http-academic-lookup.adapter.js'

const SEMESTER = { id: 'sem-1', academicYearId: 'year-1', typeName: 'Ganjil' }

const assignment = (
  id: string,
  classroomId: string,
  subjectId: string,
  classroomGradeId: string,
  subjectName = 'Matematika',
) => ({
  id,
  employeeId: 'emp-1',
  classroomId,
  subjectId,
  semesterId: 'sem-1',
  subjectName,
  classroomCode: classroomId,
  classroomGradeId,
  classroomAcademicYearId: 'year-1',
})

function build(responses: Record<string, unknown>) {
  const answer = (path: string) => {
    const hit = Object.entries(responses).find(([prefix]) =>
      path.startsWith(prefix),
    )
    return Promise.resolve(hit ? hit[1] : undefined)
  }
  const getData = jest.fn((_key: string, path: string) => answer(path))
  const postData = jest.fn((_key: string, path: string, _body: unknown) =>
    answer(path),
  )
  const malformed = jest.fn((): never => {
    throw new ServiceUnavailableException('malformed')
  })
  const client = {
    getData,
    postData,
    malformed,
  } as unknown as ServiceClient
  return { adapter: new HttpAcademicLookupAdapter(client), getData, postData }
}

describe('HttpAcademicLookupAdapter.teachingPairsOf', () => {
  it('collapses one subject taught in two classes of the same grade to one pair', async () => {
    const { adapter } = build({
      '/semesters/active': SEMESTER,
      '/teaching-assignments/by-employee': [
        assignment('a1', 'c-7a', 'math', 'grade-7'),
        assignment('a2', 'c-7b', 'math', 'grade-7'),
        assignment('a3', 'c-8a', 'math', 'grade-8'),
        assignment('a4', 'c-7a', 'ipa', 'grade-7', 'IPA'),
      ],
    })

    await expect(adapter.teachingPairsOf('emp-1')).resolves.toEqual([
      { subjectId: 'math', gradeId: 'grade-7', subjectName: 'Matematika' },
      { subjectId: 'math', gradeId: 'grade-8', subjectName: 'Matematika' },
      { subjectId: 'ipa', gradeId: 'grade-7', subjectName: 'IPA' },
    ])
  })

  it('asks for the assignments of the active semester only', async () => {
    const { adapter, getData } = build({
      '/semesters/active': SEMESTER,
      '/teaching-assignments/by-employee': [],
    })

    await adapter.teachingPairsOf('emp-1')

    expect(getData).toHaveBeenCalledWith(
      'ACADEMIC_SERVICE_URL',
      '/teaching-assignments/by-employee?employeeId=emp-1&semesterId=sem-1',
    )
  })

  it('returns nothing when no semester is active', async () => {
    const { adapter, getData } = build({ '/semesters/active': null })

    await expect(adapter.teachingPairsOf('emp-1')).resolves.toEqual([])
    expect(getData).toHaveBeenCalledTimes(1)
  })

  it('fails closed when the answer is not what the contract promises', async () => {
    const { adapter } = build({
      '/semesters/active': SEMESTER,
      '/teaching-assignments/by-employee': [{ id: 'a1' }],
    })

    await expect(adapter.teachingPairsOf('emp-1')).rejects.toThrow(
      ServiceUnavailableException,
    )
  })
})

describe('HttpAcademicLookupAdapter.gradesByIds', () => {
  it('asks once for the ids and keeps level and name', async () => {
    const { adapter, postData } = build({
      '/grades/by-ids': [
        { id: 'grade-7', level: 7, name: 'Kelas VII' },
        { id: 'grade-8', level: 8, name: null },
      ],
    })

    await expect(adapter.gradesByIds(['grade-7', 'grade-8'])).resolves.toEqual([
      { id: 'grade-7', level: 7, name: 'Kelas VII' },
      { id: 'grade-8', level: 8, name: null },
    ])
    expect(postData).toHaveBeenCalledWith(
      'ACADEMIC_SERVICE_URL',
      '/grades/by-ids',
      { ids: ['grade-7', 'grade-8'] },
    )
  })

  it('does not call academic for no ids, and fails closed on a bad answer', async () => {
    const { adapter, postData } = build({ '/grades/by-ids': [{ id: 1 }] })

    await expect(adapter.gradesByIds([])).resolves.toEqual([])
    expect(postData).not.toHaveBeenCalled()
    await expect(adapter.gradesByIds(['grade-7'])).rejects.toThrow(
      ServiceUnavailableException,
    )
  })
})
