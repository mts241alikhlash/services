import { GetMyClassroomUseCase } from './get-my-classroom.use-case.js'
import { IEnrollmentRepository } from '../../../../enrollment/domain/repositories/enrollment.repository.js'
import { IStudentIdentityReadPort } from '../../../domain/repositories/student-identity-read.port.js'
import {
  IAcademicLookupPort,
  SemesterContext,
} from '../../../../platform/academic-lookup/academic-lookup.port.js'

describe('GetMyClassroomUseCase', () => {
  const semester: SemesterContext = {
    id: 'semester-1',
    academicYearId: 'year-1',
    academicYearName: '2026/2027',
    typeId: 'type-1',
    typeName: 'Ganjil',
    isActive: true,
    sequence: 1,
  }

  function makeUseCase(options: { semester: SemesterContext | null }) {
    const findSemesterContext = jest.fn().mockResolvedValue(options.semester)
    const useCase = new GetMyClassroomUseCase(
      {
        findActiveEnrollment: jest.fn().mockResolvedValue({
          classroomId: 'classroom-1',
          semesterId: 'semester-1',
        }),
        findAll: jest.fn().mockResolvedValue({ data: [] }),
      } as unknown as IEnrollmentRepository,
      {
        findClassroomContext: jest.fn().mockResolvedValue({
          classroom: { id: 'classroom-1' },
          structure: null,
          supervisor: null,
          subjects: [],
        }),
        findSemesterContext,
      } as unknown as IAcademicLookupPort,
      {
        findStudentIdByUserId: jest.fn().mockResolvedValue('student-1'),
      } as unknown as IStudentIdentityReadPort,
    )
    return { useCase, findSemesterContext }
  }

  it('names the semester the enrollment belongs to', async () => {
    const { useCase, findSemesterContext } = makeUseCase({ semester })

    const result = await useCase.execute('user-1')

    expect(findSemesterContext).toHaveBeenCalledWith('semester-1')
    expect(result?.semester).toEqual(semester)
  })

  it('still answers when the semester cannot be resolved', async () => {
    const { useCase } = makeUseCase({ semester: null })

    const result = await useCase.execute('user-1')

    expect(result?.classroom).toEqual({ id: 'classroom-1' })
    expect(result?.semester).toBeNull()
  })
})
