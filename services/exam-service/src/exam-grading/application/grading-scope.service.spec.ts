import { ServiceUnavailableException } from '@nestjs/common'
import type { IEmployeeIdentityReadPort } from '../../platform/employee-identity/employee-identity.port.js'
import { FakeAcademicLookup } from '../../exam-schedule/application/exam-schedule.test-support.js'
import { GradingScopeService } from './grading-scope.service.js'

const teacher = {
  id: 'u1',
  roles: ['TEACHER'],
  permissions: ['exam-grading.read'],
}

const employees = (employeeId: string | null) =>
  ({
    findEmployeeIdByUserId: () => Promise.resolve(employeeId),
    employeeExists: () => Promise.resolve(true),
  }) as IEmployeeIdentityReadPort

describe('GradingScopeService', () => {
  it('allows only the subject and classroom a teacher teaches', async () => {
    const academic = new FakeAcademicLookup({
      assignments: [{ subjectId: 'math', classroomId: '7a' }],
    })
    const scope = await new GradingScopeService(
      employees('e1'),
      academic,
    ).forUser(teacher)

    expect(await scope.allows('math', '7a', 'sem-1')).toBe(true)
    expect(await scope.allows('math', '7b', 'sem-1')).toBe(false)
    expect(await scope.allows('art', '7a', 'sem-1')).toBe(false)
  })

  it('judges each semester by its own assignments', async () => {
    const academic = new FakeAcademicLookup({
      assignmentsBySemester: {
        'sem-old': [{ subjectId: 'math', classroomId: '7a' }],
        'sem-new': [],
      },
    })
    const scope = await new GradingScopeService(
      employees('e1'),
      academic,
    ).forUser(teacher)

    expect(await scope.allows('math', '7a', 'sem-old')).toBe(true)
    expect(await scope.allows('math', '7a', 'sem-new')).toBe(false)
    expect(await scope.pairsFor('sem-old')).toEqual([
      { subjectId: 'math', classroomId: '7a' },
    ])
  })

  it('asks the academic service once per semester', async () => {
    const academic = new FakeAcademicLookup({ assignments: [] })
    const spy = jest.spyOn(academic, 'teachingAssignmentsOf')
    const scope = await new GradingScopeService(
      employees('e1'),
      academic,
    ).forUser(teacher)

    await scope.allows('a', 'b', 'sem-1')
    await scope.allows('c', 'd', 'sem-1')

    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('lets manage-all through without asking anyone', async () => {
    const academic = new FakeAcademicLookup()
    const spy = jest.spyOn(academic, 'teachingAssignmentsOf')
    const scope = await new GradingScopeService(
      employees(null),
      academic,
    ).forUser({
      ...teacher,
      permissions: ['exam-grading.read', 'exam-grading.manage-all'],
    })

    expect(scope.all).toBe(true)
    expect(await scope.allows('any', 'any', 'any')).toBe(true)
    expect(spy).not.toHaveBeenCalled()
  })

  it('allows nothing to an account without an employee record', async () => {
    const scope = await new GradingScopeService(
      employees(null),
      new FakeAcademicLookup(),
    ).forUser(teacher)

    expect(scope.all).toBe(false)
    expect(await scope.allows('math', '7a', 'sem-1')).toBe(false)
    expect(await scope.pairsFor('sem-1')).toEqual([])
  })

  it('fails closed when the academic lookup is down', async () => {
    const academic = new FakeAcademicLookup({
      failWith: new ServiceUnavailableException('down'),
    })
    const scope = await new GradingScopeService(
      employees('e1'),
      academic,
    ).forUser(teacher)

    await expect(scope.allows('math', '7a', 'sem-1')).rejects.toThrow(
      ServiceUnavailableException,
    )
  })
})
