import { ConflictException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { IStudentRepository } from '../../../domain/repositories/student.repository.js'
import { IAccountProvisioningPort } from '../../../../platform/user/index.js'
import { EnrolExistingAccountUseCase } from './enrol-existing-account.use-case.js'

describe('EnrolExistingAccountUseCase', () => {
  const students = {
    findByUserId: jest.fn(),
    findByNis: jest.fn(),
    findByNisn: jest.fn(),
    enrolExistingAccount: jest.fn(),
  }
  const accountProvisioning = {
    updateProfile: jest.fn(),
    assignRole: jest.fn(),
  }

  let useCase: EnrolExistingAccountUseCase

  const input = {
    applicationId: 'app-1',
    userId: 'u1',
    nis: '2026001',
    nisn: '0101234567',
    profile: {
      name: 'Siti',
      nik: '3204014504100002',
      gender: 'FEMALE',
      birthPlace: 'Bandung',
      birthDate: '2010-04-05',
    },
  } as never

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnrolExistingAccountUseCase,
        { provide: IStudentRepository, useValue: students },
        { provide: IAccountProvisioningPort, useValue: accountProvisioning },
      ],
    }).compile()

    useCase = module.get(EnrolExistingAccountUseCase)
    jest.clearAllMocks()
  })

  it('returns the existing student on a repeat, without consulting NIS', async () => {
    students.findByUserId.mockResolvedValue({ id: 's1' })

    const result = await useCase.execute(input)

    expect(result).toEqual({
      studentId: 's1',
      parentsLinked: 0,
      enrollmentCreated: false,
      alreadyEnrolled: true,
    })
    expect(students.findByNis).not.toHaveBeenCalled()
    expect(students.enrolExistingAccount).not.toHaveBeenCalled()
    expect(accountProvisioning.updateProfile).not.toHaveBeenCalled()
  })

  it('still refuses a NIS taken by somebody else', async () => {
    students.findByUserId.mockResolvedValue(null)
    students.findByNis.mockResolvedValue({ id: 'other-student' })
    students.findByNisn.mockResolvedValue(null)

    await expect(useCase.execute(input)).rejects.toThrow(ConflictException)
    expect(students.enrolExistingAccount).not.toHaveBeenCalled()
  })

  it('refuses a NISN taken by somebody else', async () => {
    students.findByUserId.mockResolvedValue(null)
    students.findByNis.mockResolvedValue(null)
    students.findByNisn.mockResolvedValue({ id: 'other-student' })

    await expect(useCase.execute(input)).rejects.toThrow(
      'NISN 0101234567 is already in use',
    )
    expect(students.enrolExistingAccount).not.toHaveBeenCalled()
  })

  it('returns one student when repeated requests race', async () => {
    students.findByUserId.mockResolvedValue(null)
    students.findByNis.mockResolvedValue(null)
    students.findByNisn.mockResolvedValue(null)
    students.enrolExistingAccount.mockImplementation((request) => ({
      studentId: 's1',
      parentsLinked: 0,
      enrollmentCreated: false,
      alreadyEnrolled: students.enrolExistingAccount.mock.calls.length > 1,
      ...request,
    }))

    const [first, second] = await Promise.all([
      useCase.execute(input),
      useCase.execute(input),
    ])

    expect(first.studentId).toBe('s1')
    expect(second.studentId).toBe('s1')
    expect(students.enrolExistingAccount).toHaveBeenCalledTimes(2)
    expect(students.enrolExistingAccount).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ applicationId: 'app-1', userId: 'u1' }),
    )
    expect(students.enrolExistingAccount).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ applicationId: 'app-1', userId: 'u1' }),
    )
  })

  it('enrols a new account by completing its profile and role first', async () => {
    students.findByUserId.mockResolvedValue(null)
    students.findByNis.mockResolvedValue(null)
    students.findByNisn.mockResolvedValue(null)
    students.enrolExistingAccount.mockResolvedValue({
      studentId: 's1',
      parentsLinked: 2,
      enrollmentCreated: false,
      alreadyEnrolled: false,
    })

    const result = await useCase.execute(input)

    expect(accountProvisioning.updateProfile).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({ name: 'Siti', nik: '3204014504100002' }),
    )
    expect(accountProvisioning.assignRole).toHaveBeenCalledWith('u1', 'STUDENT')
    expect(students.enrolExistingAccount).toHaveBeenCalledWith(
      expect.objectContaining({ applicationId: 'app-1', userId: 'u1' }),
    )
    expect(result.studentId).toBe('s1')
  })
})
