import { Test, TestingModule } from '@nestjs/testing'
import { IEmployeeRepository } from '../../../domain/repositories/employee.repository.js'
import { UpdateEmployeeUseCase } from '../update-employee/update-employee.use-case.js'
import { UpdateEmployeeProfileUseCase } from '../update-employee-profile/update-employee-profile.use-case.js'
import { CreateEmployeeUseCase } from '../create-employee/create-employee.use-case.js'
import { ResolveBulkImportConflictsUseCase } from './resolve-bulk-import-conflicts.use-case.js'
import { ResolveBulkImportConflictsInput } from './resolve-bulk-import-conflicts.input.js'

function makeRow(overrides: Record<string, unknown> = {}) {
  return {
    identifier: 'guru001',
    password: 'P@ssw0rd!',
    name: 'Budi Santoso',
    nik: '3578010101700001',
    gender: 'MALE',
    birthPlace: 'Surabaya',
    birthDate: '1980-06-15',
    nip: '198006152005011001',
    nuptk: '1234567890123456',
    employmentTypeCode: 'PNS',
    ...overrides,
  }
}

describe('ResolveBulkImportConflictsUseCase (employee)', () => {
  let useCase: ResolveBulkImportConflictsUseCase

  const mockRepo = {
    resolveEmploymentTypeId: jest.fn().mockResolvedValue('employment-type-id'),
    findByNip: jest.fn(),
    findByNuptk: jest.fn(),
    findProfileByNik: jest.fn(),
    findByUserId: jest.fn(),
  }

  const mockUpdateEmployee = {
    execute: jest.fn(),
  }

  const mockUpdateEmployeeProfile = {
    execute: jest.fn(),
  }

  const mockCreateEmployee = {
    execute: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResolveBulkImportConflictsUseCase,
        { provide: IEmployeeRepository, useValue: mockRepo },
        { provide: UpdateEmployeeUseCase, useValue: mockUpdateEmployee },
        {
          provide: UpdateEmployeeProfileUseCase,
          useValue: mockUpdateEmployeeProfile,
        },
        { provide: CreateEmployeeUseCase, useValue: mockCreateEmployee },
      ],
    }).compile()

    useCase = module.get<ResolveBulkImportConflictsUseCase>(
      ResolveBulkImportConflictsUseCase,
    )
    jest.clearAllMocks()
    mockRepo.resolveEmploymentTypeId.mockResolvedValue('employment-type-id')
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    it('skips conflicts marked as skip', async () => {
      const dto: ResolveBulkImportConflictsInput = {
        conflicts: [{ existingId: 'gru-1', action: 'skip', data: makeRow() }],
      }

      const result = await useCase.execute(dto)

      expect(result).toEqual({
        total: 1,
        updated: 0,
        skipped: 1,
        failed: 0,
        errors: [],
      })
      expect(mockUpdateEmployee.execute).not.toHaveBeenCalled()
      expect(mockCreateEmployee.execute).not.toHaveBeenCalled()
    })

    it('creates a new employee when there is no existingId', async () => {
      mockCreateEmployee.execute.mockResolvedValue({ id: 'gru-new' })

      const dto: ResolveBulkImportConflictsInput = {
        conflicts: [{ action: 'update', data: makeRow() }],
      }

      const result = await useCase.execute(dto)

      expect(mockCreateEmployee.execute).toHaveBeenCalledWith(
        expect.objectContaining({ employmentTypeId: 'employment-type-id' }),
      )
      expect(result).toEqual({
        total: 1,
        updated: 1,
        skipped: 0,
        failed: 0,
        errors: [],
      })
    })

    it('updates an existing employee', async () => {
      const dto: ResolveBulkImportConflictsInput = {
        conflicts: [
          {
            existingId: 'gru-1',
            action: 'update',
            data: makeRow(),
          },
        ],
      }

      const result = await useCase.execute(dto)

      expect(mockUpdateEmployee.execute).toHaveBeenCalledWith(
        'gru-1',
        expect.objectContaining({ employmentTypeId: 'employment-type-id' }),
      )
      expect(mockUpdateEmployeeProfile.execute).toHaveBeenCalledWith(
        'gru-1',
        expect.objectContaining({ name: 'Budi Santoso' }),
      )
      expect(result).toEqual({
        total: 1,
        updated: 1,
        skipped: 0,
        failed: 0,
        errors: [],
      })
    })

    it('records the error and continues when update fails, instead of swallowing it', async () => {
      mockUpdateEmployee.execute.mockRejectedValue(
        new Error('Unexpected failure'),
      )

      const dto: ResolveBulkImportConflictsInput = {
        conflicts: [
          {
            existingId: 'gru-1',
            action: 'update',
            data: makeRow(),
          },
        ],
      }

      const result = await useCase.execute(dto)

      expect(result.updated).toBe(0)
      expect(result.failed).toBe(1)
      expect(result.skipped).toBe(0)
      expect(result.errors).toEqual([
        { existingId: 'gru-1', error: 'Unexpected failure' },
      ])
    })

    it('resolves a repeated employment type code only once across conflicts', async () => {
      mockCreateEmployee.execute.mockResolvedValue({ id: 'gru-new' })

      const dto: ResolveBulkImportConflictsInput = {
        conflicts: [
          {
            existingId: 'gru-1',
            action: 'update',
            data: makeRow(),
          },
          {
            action: 'update',
            data: makeRow({
              nik: '9999000000000002',
              nip: '999',
              nuptk: '9999999999999999',
            }),
          },
        ],
      }

      await useCase.execute(dto)

      expect(mockRepo.resolveEmploymentTypeId).toHaveBeenCalledTimes(1)
    })
  })
})
