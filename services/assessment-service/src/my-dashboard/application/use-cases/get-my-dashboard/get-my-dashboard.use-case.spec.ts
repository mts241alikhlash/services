import { Test, TestingModule } from '@nestjs/testing'
import { IAcademicLookupPort } from '../../../../platform/academic-lookup/academic-lookup.port.js'
import { IStudentIdentityReadPort } from '../../../../platform/student-identity/student-identity.port.js'
import { IEmployeeIdentityReadPort } from '../../../../platform/employee-identity/employee-identity.port.js'
import { IMyDashboardRepository } from '../../../domain/repositories/my-dashboard.repository.js'
import { GetMyDashboardUseCase } from './get-my-dashboard.use-case.js'

describe('GetMyDashboardUseCase', () => {
  let useCase: GetMyDashboardUseCase

  const emptyRecap = {
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    sick: 0,
  }

  const repo = {
    findActiveSemester: jest.fn(),
    findEnrolledClassroom: jest.fn(),
    findClassroomLessons: jest.fn(),
    summariseAttendance: jest.fn(),
    findLatestScores: jest.fn(),
    findLatestPublishedReportCard: jest.fn(),
    findTeachingLessons: jest.fn(),
    summariseTeachingLoad: jest.fn(),
    findSupervisedClassrooms: jest.fn(),
    findUngradedAssessments: jest.fn(),
  }
  const studentIdentity = { findStudentIdByUserId: jest.fn() }
  const employeeIdentity = { findEmployeeIdByUserId: jest.fn() }
  const academicSetting = { findSetting: jest.fn() }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetMyDashboardUseCase,
        { provide: IMyDashboardRepository, useValue: repo },
        { provide: IStudentIdentityReadPort, useValue: studentIdentity },
        { provide: IEmployeeIdentityReadPort, useValue: employeeIdentity },
        { provide: IAcademicLookupPort, useValue: academicSetting },
      ],
    }).compile()

    useCase = module.get(GetMyDashboardUseCase)
    jest.clearAllMocks()

    repo.findActiveSemester.mockResolvedValue({
      id: 'sem-1',
      name: 'Ganjil',
      academicYearId: 'ay-1',
    })
    repo.findEnrolledClassroom.mockResolvedValue({
      enrollmentId: 'enr-1',
      classroom: { id: 'cls-1', code: 'VIII-A', name: null },
    })
    repo.findClassroomLessons.mockResolvedValue([])
    repo.summariseAttendance.mockResolvedValue(emptyRecap)
    repo.findLatestScores.mockResolvedValue([])
    repo.findLatestPublishedReportCard.mockResolvedValue(null)
    repo.findTeachingLessons.mockResolvedValue([])
    repo.summariseTeachingLoad.mockResolvedValue({
      classroomCount: 4,
      subjectCount: 2,
    })
    repo.findSupervisedClassrooms.mockResolvedValue([])
    repo.findUngradedAssessments.mockResolvedValue({ rows: [], total: 0 })
    academicSetting.findSetting.mockResolvedValue({ weeklyHolidays: [0] })
  })

  it('answers with neither half for someone who is neither', async () => {
    studentIdentity.findStudentIdByUserId.mockResolvedValue(null)
    employeeIdentity.findEmployeeIdByUserId.mockResolvedValue(null)

    const result = await useCase.execute('user-admin')

    expect(result.student).toBeNull()
    expect(result.employee).toBeNull()
    expect(repo.findEnrolledClassroom).not.toHaveBeenCalled()
    expect(repo.summariseTeachingLoad).not.toHaveBeenCalled()
  })

  it('answers only about the student when the caller only studies', async () => {
    studentIdentity.findStudentIdByUserId.mockResolvedValue('stu-1')
    employeeIdentity.findEmployeeIdByUserId.mockResolvedValue(null)

    const result = await useCase.execute('user-student')

    expect(result.student?.classroom?.code).toBe('VIII-A')
    expect(result.employee).toBeNull()
    expect(repo.summariseTeachingLoad).not.toHaveBeenCalled()
  })

  it('answers both halves for someone who teaches and also studies', async () => {
    studentIdentity.findStudentIdByUserId.mockResolvedValue('stu-1')
    employeeIdentity.findEmployeeIdByUserId.mockResolvedValue('tch-1')

    const result = await useCase.execute('user-both')

    expect(result.student).not.toBeNull()
    expect(result.employee?.load.classroomCount).toBe(4)
  })

  it('reads every query against the resolved ids, never the user id', async () => {
    studentIdentity.findStudentIdByUserId.mockResolvedValue('stu-1')
    employeeIdentity.findEmployeeIdByUserId.mockResolvedValue('tch-1')

    await useCase.execute('user-both')

    expect(repo.findEnrolledClassroom).toHaveBeenCalledWith('stu-1', 'sem-1')
    expect(repo.summariseTeachingLoad).toHaveBeenCalledWith('tch-1', 'sem-1')
    expect(repo.summariseAttendance).toHaveBeenCalledWith('enr-1')
  })

  it('still answers between years, when no semester is active', async () => {
    studentIdentity.findStudentIdByUserId.mockResolvedValue('stu-1')
    employeeIdentity.findEmployeeIdByUserId.mockResolvedValue(null)
    repo.findActiveSemester.mockResolvedValue(null)

    const result = await useCase.execute('user-student')

    expect(result.semester).toBeNull()
    expect(result.student?.classroom).toBeNull()
    expect(result.student?.attendance).toEqual(emptyRecap)
  })
})
