import { Test, TestingModule } from '@nestjs/testing'
import { UpdateProfileDto } from '../../../platform/profile/index.js'
import { CreateEmployeeDto } from './dto/request/create-employee.dto.js'
import { EmployeeQueryDto } from './dto/request/employee-query.dto.js'
import { ExportEmployeeQueryDto } from './dto/request/export-employee-query.dto.js'
import { UpdateEmployeeDto } from './dto/request/update-employee.dto.js'
import { BulkImportEmployeesUseCase } from '../../application/use-cases/bulk-import-employee/bulk-import-employee.use-case.js'
import { CreateEmployeeUseCase } from '../../application/use-cases/create-employee/create-employee.use-case.js'
import { DeleteEmployeeUseCase } from '../../application/use-cases/delete-employee/delete-employee.use-case.js'
import { ExportEmployeesUseCase } from '../../application/use-cases/export-employee/export-employee.use-case.js'
import { GetEmployeeByIdUseCase } from '../../application/use-cases/get-employee-by-id/get-employee-by-id.use-case.js'
import { GetEmployeesUseCase } from '../../application/use-cases/get-employees/get-employees.use-case.js'
import { GetMyEmployeeUseCase } from '../../application/use-cases/get-my-employee/get-my-employee.use-case.js'
import { ResolveBulkImportConflictsUseCase } from '../../application/use-cases/resolve-bulk-import-conflicts/resolve-bulk-import-conflicts.use-case.js'
import { ToggleEmployeeActiveUseCase } from '../../application/use-cases/toggle-employee-active/toggle-employee-active.use-case.js'
import { UpdateEmployeeProfileUseCase } from '../../application/use-cases/update-employee-profile/update-employee-profile.use-case.js'
import { UpdateEmployeeUseCase } from '../../application/use-cases/update-employee/update-employee.use-case.js'
import { EmployeeController } from './employee.controller.js'
import { EmployeeImportExportController } from './employee-import-export.controller.js'

describe('EmployeeController & EmployeeImportExportController', () => {
  let controller: EmployeeController
  let importExportController: EmployeeImportExportController

  const mockGetEmployeesUseCase = { execute: jest.fn() }
  const mockGetEmployeeByIdUseCase = { execute: jest.fn() }
  const mockGetMyEmployeeUseCase = { execute: jest.fn() }
  const mockCreateEmployeeUseCase = { execute: jest.fn() }
  const mockUpdateEmployeeUseCase = { execute: jest.fn() }
  const mockDeleteEmployeeUseCase = { execute: jest.fn() }
  const mockToggleEmployeeActiveUseCase = { execute: jest.fn() }
  const mockUpdateProfileUseCase = { execute: jest.fn() }
  const mockBulkImportEmployeesUseCase = { execute: jest.fn() }
  const mockResolveBulkImportConflictsUseCase = { execute: jest.fn() }
  const mockExportEmployeesUseCase = { execute: jest.fn() }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeeImportExportController, EmployeeController],
      providers: [
        { provide: GetEmployeesUseCase, useValue: mockGetEmployeesUseCase },
        { provide: GetMyEmployeeUseCase, useValue: mockGetMyEmployeeUseCase },
        {
          provide: GetEmployeeByIdUseCase,
          useValue: mockGetEmployeeByIdUseCase,
        },
        { provide: CreateEmployeeUseCase, useValue: mockCreateEmployeeUseCase },
        { provide: UpdateEmployeeUseCase, useValue: mockUpdateEmployeeUseCase },
        { provide: DeleteEmployeeUseCase, useValue: mockDeleteEmployeeUseCase },
        {
          provide: ToggleEmployeeActiveUseCase,
          useValue: mockToggleEmployeeActiveUseCase,
        },
        {
          provide: UpdateEmployeeProfileUseCase,
          useValue: mockUpdateProfileUseCase,
        },
        {
          provide: BulkImportEmployeesUseCase,
          useValue: mockBulkImportEmployeesUseCase,
        },
        {
          provide: ResolveBulkImportConflictsUseCase,
          useValue: mockResolveBulkImportConflictsUseCase,
        },
        {
          provide: ExportEmployeesUseCase,
          useValue: mockExportEmployeesUseCase,
        },
      ],
    }).compile()

    controller = module.get<EmployeeController>(EmployeeController)
    importExportController = module.get<EmployeeImportExportController>(
      EmployeeImportExportController,
    )
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
    expect(importExportController).toBeDefined()
  })

  describe('findAll', () => {
    it('should delegate to GetEmployeesUseCase with query', async () => {
      const query: EmployeeQueryDto = { page: 1, limit: 10 }
      const expected = {
        data: [],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      }
      mockGetEmployeesUseCase.execute.mockResolvedValue(expected)

      const result = await controller.findAll(query)

      expect(mockGetEmployeesUseCase.execute).toHaveBeenCalledWith(query)
      expect(result).toEqual(expected)
    })
  })

  describe('findOne', () => {
    it('should delegate to GetEmployeeByIdUseCase with id', async () => {
      const id = 'emp-1'
      const expected = { id: 'emp-1', profile: { name: 'Budi Santoso' } }
      mockGetEmployeeByIdUseCase.execute.mockResolvedValue(expected)

      const result = await controller.findOne(id)

      expect(mockGetEmployeeByIdUseCase.execute).toHaveBeenCalledWith(id)
      expect(result).toEqual(expected)
    })
  })

  describe('create', () => {
    it('should delegate to CreateEmployeeUseCase with dto', async () => {
      const dto = {
        identifier: 'guru001',
        name: 'Budi Santoso',
      } as CreateEmployeeDto
      const expected = { id: 'emp-new', profile: { name: 'Budi Santoso' } }
      mockCreateEmployeeUseCase.execute.mockResolvedValue(expected)

      const result = await controller.create(dto)

      expect(mockCreateEmployeeUseCase.execute).toHaveBeenCalledWith(dto)
      expect(result).toEqual(expected)
    })
  })

  describe('bulkImport', () => {
    it('should delegate buffer to BulkImportEmployeesUseCase and return result', async () => {
      const fakeFile = {
        buffer: Buffer.from('fake-excel'),
        mimetype:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        originalname: 'employees.xlsx',
      } as Express.Multer.File

      const expected = {
        total: 2,
        success: 2,
        failed: 0,
        results: [
          { row: 2, status: 'SUCCESS', identifier: 'guru001' },
          { row: 3, status: 'SUCCESS', identifier: 'guru002' },
        ],
      }
      mockBulkImportEmployeesUseCase.execute.mockResolvedValue(expected)

      const result = await importExportController.bulkImport(fakeFile)

      expect(mockBulkImportEmployeesUseCase.execute).toHaveBeenCalledWith(
        fakeFile.buffer,
      )
      expect(result).toEqual(expected)
    })
  })

  describe('export', () => {
    it('should return a StreamableFile wrapping the buffer from ExportEmployeesUseCase', async () => {
      const fakeBuffer = Buffer.from('PK-fake-xlsx')
      mockExportEmployeesUseCase.execute.mockResolvedValue(fakeBuffer)

      const query: ExportEmployeeQueryDto = { search: 'Budi' }
      const result = await importExportController.export(query)

      expect(mockExportEmployeesUseCase.execute).toHaveBeenCalledWith(query)
      expect(result).toBeDefined()
    })
  })

  describe('update', () => {
    it('should delegate to UpdateEmployeeUseCase with id and dto', async () => {
      const id = 'emp-1'
      const dto: UpdateEmployeeDto = { nip: '198006152005011001' }
      const expected = { id: 'emp-1', nip: '198006152005011001' }
      mockUpdateEmployeeUseCase.execute.mockResolvedValue(expected)

      const result = await controller.update(id, dto)

      expect(mockUpdateEmployeeUseCase.execute).toHaveBeenCalledWith(id, dto)
      expect(result).toEqual(expected)
    })
  })

  describe('remove', () => {
    it('should delegate to DeleteEmployeeUseCase with id', async () => {
      const id = 'emp-1'
      mockDeleteEmployeeUseCase.execute.mockResolvedValue(undefined)

      await controller.remove(id)

      expect(mockDeleteEmployeeUseCase.execute).toHaveBeenCalledWith(id)
    })
  })

  describe('updateProfile', () => {
    it('should delegate to UpdateEmployeeProfileUseCase with id and dto', async () => {
      const id = 'emp-1'
      const dto: UpdateProfileDto = { name: 'Budi Revised' }
      const expected = { id: 'p-1', name: 'Budi Revised' }
      mockUpdateProfileUseCase.execute.mockResolvedValue(expected)

      const result = await controller.updateProfile(id, dto)

      expect(mockUpdateProfileUseCase.execute).toHaveBeenCalledWith(id, dto)
      expect(result).toEqual(expected)
    })
  })

  describe('findMine', () => {
    it('reads the caller own record, with no id to pass', async () => {
      const employee = { id: 'emp-1', userId: 'user-1' }
      mockGetMyEmployeeUseCase.execute.mockResolvedValue(employee)

      const result = await controller.findMine({ id: 'user-1' } as never)

      expect(mockGetMyEmployeeUseCase.execute).toHaveBeenCalledWith('user-1')
      expect(result).toBe(employee)
    })
  })
})
