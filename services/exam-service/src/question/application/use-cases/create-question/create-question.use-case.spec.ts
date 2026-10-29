import { BadRequestException, ForbiddenException } from '@nestjs/common'
import {
  FakeQuestionRepository,
  MANAGER,
  MATH_7,
  TEACHER,
  buildTeacherScope,
} from '../../question.repository.fake.js'
import { CreateQuestionUseCase } from './create-question.use-case.js'
import type { CreateQuestionInput } from './create-question.input.js'

const input: CreateQuestionInput = {
  ...MATH_7,
  packageId: 'package-1',
  type: 'MULTIPLE_CHOICE',
  bodyHtml: '<p onclick="x()">Berapa 1 + 1?</p><script>x</script>',
  content: {
    choices: [
      { key: 'A', html: '<p>1</p>' },
      { key: 'B', html: '<p>2</p><script>x</script>' },
    ],
    answer: { key: 'B' },
  },
  points: 2,
}

function build(fixture: Parameters<typeof buildTeacherScope>[0]) {
  const repository = new FakeQuestionRepository()
  const { scope, employees } = buildTeacherScope(fixture)
  return {
    repository,
    useCase: new CreateQuestionUseCase(repository, scope, employees),
  }
}

describe('CreateQuestionUseCase', () => {
  it('writes a sanitized draft at version 1 owned by the signed-in teacher', async () => {
    const { repository, useCase } = build({
      employeeId: 'emp-1',
      pairs: [MATH_7],
    })

    const question = await useCase.execute(TEACHER, input)

    expect(question).toMatchObject({
      status: 'DRAFT',
      currentVersion: 1,
      approvedVersion: null,
      authorEmployeeId: 'emp-1',
      createdById: TEACHER.id,
      current: {
        number: 1,
        bodyHtml: '<p>Berapa 1 + 1?</p>',
        points: 2,
        content: {
          choices: [
            { key: 'A', html: '<p>1</p>' },
            { key: 'B', html: '<p>2</p>' },
          ],
          answer: { key: 'B' },
        },
      },
    })
    expect(repository.questions.size).toBe(1)
  })

  it('refuses a subject and grade the teacher does not teach', async () => {
    const { repository, useCase } = build({ employeeId: 'emp-1', pairs: [] })

    await expect(useCase.execute(TEACHER, input)).rejects.toThrow(
      new ForbiddenException('Mapel dan tingkat ini bukan ampuan Anda'),
    )
    expect(repository.questions.size).toBe(0)
  })

  it('refuses a teacher who names another author', async () => {
    const { useCase } = build({ employeeId: 'emp-1', pairs: [MATH_7] })

    await expect(
      useCase.execute(TEACHER, { ...input, authorEmployeeId: 'emp-2' }),
    ).rejects.toThrow(ForbiddenException)
  })

  it('lets a manager write on behalf of an existing teacher', async () => {
    const { useCase } = build({
      employeeId: null,
      existingEmployees: ['emp-2'],
    })

    const question = await useCase.execute(MANAGER, {
      ...input,
      authorEmployeeId: 'emp-2',
    })

    expect(question.authorEmployeeId).toBe('emp-2')
    expect(question.createdById).toBe(MANAGER.id)
  })

  it('refuses a manager who names no author and has no employee record', async () => {
    const { useCase } = build({ employeeId: null })

    await expect(useCase.execute(MANAGER, input)).rejects.toThrow(
      new BadRequestException('Pilih guru penulis soal'),
    )
  })

  it('refuses a manager who names an author that does not exist', async () => {
    const { useCase } = build({ employeeId: null, existingEmployees: [] })

    await expect(
      useCase.execute(MANAGER, { ...input, authorEmployeeId: 'ghost' }),
    ).rejects.toThrow(new BadRequestException('Penulis soal tidak ditemukan'))
  })

  it('refuses content that does not fit the type', async () => {
    const { useCase } = build({ employeeId: 'emp-1', pairs: [MATH_7] })

    await expect(
      useCase.execute(TEACHER, { ...input, content: { answer: { key: 'Z' } } }),
    ).rejects.toThrow(BadRequestException)
  })

  it.each([0, 0.1, -3, 101, Number.NaN])(
    'refuses %s points',
    async (points) => {
      const { repository, useCase } = build({
        employeeId: 'emp-1',
        pairs: [MATH_7],
      })

      await expect(
        useCase.execute(TEACHER, { ...input, points }),
      ).rejects.toThrow(
        new BadRequestException('Poin harus antara 0,25 dan 100'),
      )
      expect(repository.questions.size).toBe(0)
    },
  )
})
