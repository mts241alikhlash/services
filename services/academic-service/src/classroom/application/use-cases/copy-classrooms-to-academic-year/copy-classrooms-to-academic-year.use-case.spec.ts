import { BadRequestException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { IAcademicYearRepository } from '../../../../academic-year/domain/repositories/academic-year.repository.js'
import { IClassroomRepository } from '../../../domain/repositories/classroom.repository.js'
import { CopyClassroomsToAcademicYearUseCase } from './copy-classrooms-to-academic-year.use-case.js'

describe('CopyClassroomsToAcademicYearUseCase', () => {
  let useCase: CopyClassroomsToAcademicYearUseCase

  const classrooms = { copyToAcademicYear: jest.fn() }
  const academicYears = { findById: jest.fn() }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CopyClassroomsToAcademicYearUseCase,
        { provide: IClassroomRepository, useValue: classrooms },
        { provide: IAcademicYearRepository, useValue: academicYears },
      ],
    }).compile()

    useCase = module.get(CopyClassroomsToAcademicYearUseCase)
    jest.resetAllMocks()

    academicYears.findById.mockImplementation((id: string) =>
      Promise.resolve({
        id,
        name: id === 'ay-2026' ? '2026/2027' : '2027/2028',
      }),
    )
  })

  it('copies one year into the other', async () => {
    classrooms.copyToAcademicYear.mockResolvedValue({
      created: 6,
      skipped: 0,
    })

    const result = await useCase.execute('ay-2026', 'ay-2027')

    expect(result).toEqual({ created: 6, skipped: 0 })
    expect(classrooms.copyToAcademicYear).toHaveBeenCalledWith(
      'ay-2026',
      'ay-2027',
    )
  })

  it('adds nothing the second time', async () => {
    classrooms.copyToAcademicYear.mockResolvedValue({
      created: 0,
      skipped: 6,
    })

    await expect(useCase.execute('ay-2026', 'ay-2027')).resolves.toEqual({
      created: 0,
      skipped: 6,
    })
  })

  it('fills the gaps around what is already there', async () => {
    classrooms.copyToAcademicYear.mockResolvedValue({
      created: 5,
      skipped: 1,
    })

    await expect(useCase.execute('ay-2026', 'ay-2027')).resolves.toEqual({
      created: 5,
      skipped: 1,
    })
  })

  it('refuses one year twice', async () => {
    await expect(useCase.execute('ay-2026', 'ay-2026')).rejects.toThrow(
      BadRequestException,
    )
    expect(classrooms.copyToAcademicYear).not.toHaveBeenCalled()
  })

  it('refuses a year that does not exist', async () => {
    academicYears.findById.mockResolvedValueOnce(null)

    await expect(useCase.execute('ay-nope', 'ay-2027')).rejects.toThrow(
      BadRequestException,
    )
    expect(classrooms.copyToAcademicYear).not.toHaveBeenCalled()
  })

  it('refuses when the source year has no classrooms, and names it', async () => {
    classrooms.copyToAcademicYear.mockResolvedValue({
      created: 0,
      skipped: 0,
    })

    await expect(useCase.execute('ay-2026', 'ay-2027')).rejects.toThrow(
      /2026\/2027 has no classrooms/,
    )
  })
})
