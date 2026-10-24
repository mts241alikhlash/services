import { ForbiddenException } from '@nestjs/common'
import type { IEmployeeIdentityReadPort } from '../../platform/employee-identity/employee-identity.port.js'
import type { IAcademicLookupPort } from '../../platform/academic-lookup/academic-lookup.port.js'
import { TeacherScope } from './teacher-scope.service.js'

const teacher = {
  id: 'user-1',
  roles: ['TEACHER'],
  permissions: ['exam-questions.read'],
}

function build(options: {
  employeeId: string | null
  pairs?: { subjectId: string; gradeId: string }[]
}) {
  const findEmployeeIdByUserId = jest.fn().mockResolvedValue(options.employeeId)
  const teachingPairsOf = jest.fn().mockResolvedValue(options.pairs ?? [])
  const scope = new TeacherScope(
    { findEmployeeIdByUserId } as unknown as IEmployeeIdentityReadPort,
    { teachingPairsOf },
  )
  return { scope, findEmployeeIdByUserId, teachingPairsOf }
}

describe('TeacherScope.forUser', () => {
  it('covers everything for a user with manage-all, without asking academic', async () => {
    const { scope, findEmployeeIdByUserId, teachingPairsOf } = build({
      employeeId: 'emp-1',
    })

    const result = await scope.forUser({
      ...teacher,
      permissions: ['exam-questions.read', 'exam-questions.manage-all'],
    })

    expect(result).toEqual({ all: true })
    expect(findEmployeeIdByUserId).not.toHaveBeenCalled()
    expect(teachingPairsOf).not.toHaveBeenCalled()
  })

  it("lists the signed-in teacher's own subject and grade pairs", async () => {
    const pairs = [{ subjectId: 'math', gradeId: 'grade-7' }]
    const { scope, teachingPairsOf } = build({ employeeId: 'emp-1', pairs })

    await expect(scope.forUser(teacher)).resolves.toEqual({ all: false, pairs })
    expect(teachingPairsOf).toHaveBeenCalledWith('emp-1')
  })

  it('covers nothing for a user with no employee record', async () => {
    const { scope, teachingPairsOf } = build({ employeeId: null })

    await expect(scope.forUser(teacher)).resolves.toEqual({
      all: false,
      pairs: [],
    })
    expect(teachingPairsOf).not.toHaveBeenCalled()
  })
})

describe('TeacherScope.assertCovers', () => {
  const { scope } = build({ employeeId: null })
  const own = {
    all: false as const,
    pairs: [{ subjectId: 'math', gradeId: 'grade-7' }],
  }

  it('accepts a pair the teacher teaches and anything for all', () => {
    expect(() => scope.assertCovers(own, 'math', 'grade-7')).not.toThrow()
    expect(() => scope.assertCovers({ all: true }, 'x', 'y')).not.toThrow()
  })

  it('refuses a pair outside the list', () => {
    expect(() => scope.assertCovers(own, 'math', 'grade-8')).toThrow(
      new ForbiddenException('Mapel dan tingkat ini bukan ampuan Anda'),
    )
    expect(() => scope.assertCovers(own, 'ipa', 'grade-7')).toThrow(
      ForbiddenException,
    )
  })
})

describe('TeacherScope.assertCanModify', () => {
  const question = {
    subjectId: 'math',
    gradeId: 'grade-7',
    authorEmployeeId: 'emp-1',
  }
  const pairs = [{ subjectId: 'math', gradeId: 'grade-7' }]

  it('lets the author change a question in their own pair', async () => {
    const { scope } = build({ employeeId: 'emp-1', pairs })

    await expect(
      scope.assertCanModify(teacher, question),
    ).resolves.toBeUndefined()
  })

  it('refuses a colleague who teaches the same pair', async () => {
    const { scope } = build({ employeeId: 'emp-2', pairs })

    await expect(scope.assertCanModify(teacher, question)).rejects.toThrow(
      new ForbiddenException('Soal ini ditulis guru lain'),
    )
  })

  it('refuses a pair outside the teacher scope even for the author', async () => {
    const { scope } = build({ employeeId: 'emp-1', pairs: [] })

    await expect(scope.assertCanModify(teacher, question)).rejects.toThrow(
      new ForbiddenException('Mapel dan tingkat ini bukan ampuan Anda'),
    )
  })

  it('lets a user with manage-all change any question', async () => {
    const { scope } = build({ employeeId: 'emp-9' })

    await expect(
      scope.assertCanModify(
        { ...teacher, permissions: ['exam-questions.manage-all'] },
        question,
      ),
    ).resolves.toBeUndefined()
  })
})

describe('TeacherScope.employeeIdOf', () => {
  it('refuses an account with no employee record', async () => {
    const { scope } = build({ employeeId: null })

    await expect(scope.employeeIdOf(teacher)).rejects.toThrow(
      new ForbiddenException('Akun Anda belum terhubung ke data pegawai'),
    )
  })
})
