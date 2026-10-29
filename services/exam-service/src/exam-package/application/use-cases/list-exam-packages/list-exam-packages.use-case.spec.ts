import { MATH_7 } from '../../../../question/application/question.repository.fake.js'
import type { ExamPackageStatus } from '../../../domain/entities/exam-package.entity.js'
import { FakeExamPackageRepository } from '../../exam-package.repository.fake.js'
import { ListExamPackagesUseCase } from './list-exam-packages.use-case.js'

const TEACHER = { id: 'user-1', permissions: ['exam-packages.read'] }
const MANAGER = {
  id: 'user-2',
  permissions: ['exam-packages.read', 'exam-questions.manage-all'],
}

async function setup() {
  const packages = new FakeExamPackageRepository()
  const make = async (
    title: string,
    createdById: string,
    status: ExamPackageStatus,
  ) => {
    const row = await packages.create({
      title,
      ...MATH_7,
      createdById,
      items: [],
    })
    packages.packages.set(row.id, { ...row, status })
  }
  await make('Milik sendiri draf', 'user-1', 'DRAFT')
  await make('Milik sendiri dikembalikan', 'user-1', 'RETURNED')
  await make('Orang lain draf', 'user-9', 'DRAFT')
  await make('Orang lain diajukan', 'user-9', 'SUBMITTED')
  await make('Orang lain disetujui', 'user-9', 'APPROVED')
  await make('Orang lain dijadwalkan', 'user-9', 'LOCKED')
  return new ListExamPackagesUseCase(packages)
}

describe('ListExamPackagesUseCase', () => {
  it('a teacher sees own packages in any status and approved or locked ones of others', async () => {
    const useCase = await setup()

    const result = await useCase.execute(TEACHER, {})

    expect(result.data.map((row) => row.title).sort()).toEqual([
      'Milik sendiri dikembalikan',
      'Milik sendiri draf',
      'Orang lain dijadwalkan',
      'Orang lain disetujui',
    ])
    expect(result.total).toBe(4)
  })

  it('a manager sees every package', async () => {
    const useCase = await setup()

    const result = await useCase.execute(MANAGER, {})

    expect(result.total).toBe(6)
  })

  it('still filters by status for a teacher', async () => {
    const useCase = await setup()

    const result = await useCase.execute(TEACHER, { status: 'DRAFT' })

    expect(result.data.map((row) => row.title)).toEqual(['Milik sendiri draf'])
  })
})
