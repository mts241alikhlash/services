import { Test, TestingModule } from '@nestjs/testing'
import { IEmployeeRepository } from '../../../domain/repositories/employee.repository.js'
import { ExportEmployeesUseCase } from './export-employee.use-case.js'

const mockEmployee = {
  nip: '198006152005011001',
  nuptk: '1234567890123456',
  employmentType: { id: 'type-1', name: 'PNS', code: 'PNS' },
  user: {
    identifier: 'guru001',
    isActive: true,
    profile: {
      name: 'Budi Santoso',
      nik: '3578010101700001',
      gender: 'MALE',
      birthPlace: 'Surabaya',
      birthDate: new Date('1980-06-15'),
      email: 'budi@test.com',
      phone: '081298765432',
    },
  },
  positions: [{ isPrimary: true, position: { name: 'Guru Matematika' } }],
}

describe('ExportEmployeesUseCase', () => {
  let useCase: ExportEmployeesUseCase

  const mockRepo = {
    findAllForExport: jest.fn(),
    getActiveEmploymentTypeCodes: jest
      .fn()
      .mockResolvedValue(['PNS', 'PPPK', 'NON_ASN']),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportEmployeesUseCase,
        { provide: IEmployeeRepository, useValue: mockRepo },
      ],
    }).compile()

    useCase = module.get<ExportEmployeesUseCase>(ExportEmployeesUseCase)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    it('should return a Buffer', async () => {
      mockRepo.findAllForExport.mockResolvedValue([mockEmployee])

      const result = await useCase.execute({})

      expect(result).toBeInstanceOf(Buffer)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should call findAllForExport with provided filters', async () => {
      mockRepo.findAllForExport.mockResolvedValue([])

      await useCase.execute({
        search: 'Budi',
        employmentTypeId: 'type-1',
      })

      expect(mockRepo.findAllForExport).toHaveBeenCalledWith({
        search: 'Budi',
        employmentTypeId: 'type-1',
      })
    })

    it('should return a valid XLSX buffer even when no employees match', async () => {
      mockRepo.findAllForExport.mockResolvedValue([])

      const result = await useCase.execute({})

      expect(result[0]).toBe(0x50)
      expect(result[1]).toBe(0x4b)
    })

    it('should handle employees without optional fields', async () => {
      const employeeMinimal = {
        nip: null,
        nuptk: null,
        employmentType: { id: 'type-2', name: 'HONORER', code: 'HONORER' },
        user: {
          identifier: 'guru002',
          isActive: false,
          profile: null,
        },
        positions: [],
      }
      mockRepo.findAllForExport.mockResolvedValue([employeeMinimal])

      const result = await useCase.execute({})

      expect(result).toBeInstanceOf(Buffer)
    })
  })
})
