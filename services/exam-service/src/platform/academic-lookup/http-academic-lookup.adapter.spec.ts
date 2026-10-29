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

const classroomRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'c-7a',
  code: '7A',
  name: 'VII A',
  gradeId: 'grade-7',
  academicYearId: 'year-1',
  capacity: 30,
  gradeLevel: 7,
  gradeName: 'VII',
  ...overrides,
})

describe('HttpAcademicLookupAdapter.classroomsByIds', () => {
  it('maps the detail rows to classroom references', async () => {
    const { adapter, postData } = build({
      '/classrooms/by-ids': [
        classroomRow(),
        classroomRow({ id: 'c-7b', name: null }),
      ],
    })

    await expect(adapter.classroomsByIds(['c-7a', 'c-7b'])).resolves.toEqual([
      {
        id: 'c-7a',
        gradeId: 'grade-7',
        academicYearId: 'year-1',
        name: 'VII A',
      },
      { id: 'c-7b', gradeId: 'grade-7', academicYearId: 'year-1', name: null },
    ])
    expect(postData).toHaveBeenCalledWith(
      'ACADEMIC_SERVICE_URL',
      '/classrooms/by-ids',
      { ids: ['c-7a', 'c-7b'] },
    )
  })

  it('returns an empty list without calling the service for no ids', async () => {
    const { adapter, postData } = build({})

    await expect(adapter.classroomsByIds([])).resolves.toEqual([])
    expect(postData).not.toHaveBeenCalled()
  })

  it('treats a row without an academic year as malformed', async () => {
    const { adapter } = build({
      '/classrooms/by-ids': [classroomRow({ academicYearId: undefined })],
    })

    await expect(adapter.classroomsByIds(['c-7a'])).rejects.toThrow('malformed')
  })

  it('treats a row without a grade as malformed', async () => {
    const { adapter } = build({
      '/classrooms/by-ids': [classroomRow({ gradeId: undefined })],
    })

    await expect(adapter.classroomsByIds(['c-7a'])).rejects.toThrow('malformed')
  })

  it('treats a non-list answer as malformed', async () => {
    const { adapter } = build({ '/classrooms/by-ids': { nope: true } })

    await expect(adapter.classroomsByIds(['c-7a'])).rejects.toThrow('malformed')
  })
})

describe('HttpAcademicLookupAdapter.activeSemester', () => {
  it('returns the id and academic year of the active semester', async () => {
    const { adapter } = build({ '/semesters/active': SEMESTER })

    await expect(adapter.activeSemester()).resolves.toEqual({
      id: 'sem-1',
      academicYearId: 'year-1',
    })
  })

  it('returns null when there is no active semester', async () => {
    const { adapter } = build({ '/semesters/active': null })

    await expect(adapter.activeSemester()).resolves.toBeNull()
  })

  it('treats a semester without an academic year as malformed', async () => {
    const { adapter } = build({ '/semesters/active': { id: 'sem-1' } })

    await expect(adapter.activeSemester()).rejects.toThrow('malformed')
  })
})

describe('HttpAcademicLookupAdapter.teachingAssignmentsOf', () => {
  it('reads what an employee teaches in the given semester', async () => {
    const getData = jest.fn((_key: string, _path: string) =>
      Promise.resolve([
        assignment('a1', 'room-7a', 'math', 'grade-7'),
        assignment('a2', 'room-7b', 'math', 'grade-7'),
      ]),
    )
    const malformed = jest.fn((): never => {
      throw new ServiceUnavailableException('malformed')
    })
    const adapter = new HttpAcademicLookupAdapter({
      getData,
      malformed,
    } as unknown as ServiceClient)

    await expect(
      adapter.teachingAssignmentsOf('emp 1', 'sem-1'),
    ).resolves.toEqual([
      { subjectId: 'math', classroomId: 'room-7a' },
      { subjectId: 'math', classroomId: 'room-7b' },
    ])
    expect(getData).toHaveBeenCalledWith(
      'ACADEMIC_SERVICE_URL',
      '/teaching-assignments/by-employee?employeeId=emp%201&semesterId=sem-1',
    )
  })

  it('fails closed on a malformed answer', async () => {
    const getData = jest.fn((_key: string, _path: string) =>
      Promise.resolve({ nope: 1 }),
    )
    const malformed = jest.fn((): never => {
      throw new ServiceUnavailableException('malformed')
    })
    const adapter = new HttpAcademicLookupAdapter({
      getData,
      malformed,
    } as unknown as ServiceClient)

    await expect(
      adapter.teachingAssignmentsOf('emp-1', 'sem-1'),
    ).rejects.toThrow(ServiceUnavailableException)
  })
})
