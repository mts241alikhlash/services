import { Test, TestingModule } from '@nestjs/testing'
import { CreateAcademicCalendarDto } from './dto/request/create-academic-calendar.dto.js'
import { UpdateAcademicCalendarDto } from './dto/request/update-academic-calendar.dto.js'
import { CreateAcademicCalendarUseCase } from '../../application/use-cases/create-academic-calendar/create-academic-calendar.use-case.js'
import { BulkDeleteAcademicCalendarsUseCase } from '../../application/use-cases/bulk-delete-academic-calendars/bulk-delete-academic-calendars.use-case.js'
import { DeleteAcademicCalendarUseCase } from '../../application/use-cases/delete-academic-calendar/delete-academic-calendar.use-case.js'
import { GetAcademicCalendarByIdUseCase } from '../../application/use-cases/get-academic-calendar-by-id/get-academic-calendar-by-id.use-case.js'
import { GetAcademicCalendarsUseCase } from '../../application/use-cases/get-academic-calendars/get-academic-calendars.use-case.js'
import { UpdateAcademicCalendarUseCase } from '../../application/use-cases/update-academic-calendar/update-academic-calendar.use-case.js'
import { AcademicCalendarController } from './academic-calendar.controller.js'

const calendarRow = {
  id: 'ac-1',
  academicYearId: 'ay-1',
  title: 'Ujian Tengah Semester',
  typeId: 'type-1',
  startDate: new Date('2026-10-01T00:00:00.000Z'),
  endDate: new Date('2026-10-05T00:00:00.000Z'),
}

const calendarResponse = {
  ...calendarRow,
  startDate: '2026-10-01T00:00:00.000Z',
  endDate: '2026-10-05T00:00:00.000Z',
}

describe('AcademicCalendarController', () => {
  let controller: AcademicCalendarController

  const mockGetAll = { execute: jest.fn() }
  const mockGetById = { execute: jest.fn() }
  const mockCreate = { execute: jest.fn() }
  const mockUpdate = { execute: jest.fn() }
  const mockDelete = { execute: jest.fn() }
  const mockBulkDelete = { execute: jest.fn() }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AcademicCalendarController],
      providers: [
        { provide: GetAcademicCalendarsUseCase, useValue: mockGetAll },
        { provide: GetAcademicCalendarByIdUseCase, useValue: mockGetById },
        { provide: CreateAcademicCalendarUseCase, useValue: mockCreate },
        { provide: UpdateAcademicCalendarUseCase, useValue: mockUpdate },
        { provide: DeleteAcademicCalendarUseCase, useValue: mockDelete },
        {
          provide: BulkDeleteAcademicCalendarsUseCase,
          useValue: mockBulkDelete,
        },
      ],
    }).compile()

    controller = module.get<AcademicCalendarController>(
      AcademicCalendarController,
    )
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('findAll', () => {
    it('should delegate to GetAcademicCalendarsUseCase', async () => {
      const query = { page: 1, limit: 10 }
      mockGetAll.execute.mockResolvedValue({ data: [] })
      const result = await controller.findAll(query)
      expect(mockGetAll.execute).toHaveBeenCalledWith(query)
      expect(result).toEqual({ data: [] })
    })
  })

  describe('findOne', () => {
    it('should delegate to GetAcademicCalendarByIdUseCase', async () => {
      mockGetById.execute.mockResolvedValue(calendarRow)
      const result = await controller.findOne('ac-1')
      expect(mockGetById.execute).toHaveBeenCalledWith('ac-1')
      expect(result).toEqual(calendarResponse)
    })
  })

  describe('create', () => {
    it('should delegate to CreateAcademicCalendarUseCase', async () => {
      const dto: CreateAcademicCalendarDto = {
        academicYearId: 'ay-1',
        title: 'Semester Ganjil',
        typeId: 'calendar-type-uuid',
        startDate: '2024-07-15',
        endDate: '2024-12-20',
      }
      mockCreate.execute.mockResolvedValue(calendarRow)
      await controller.create(dto)
      expect(mockCreate.execute).toHaveBeenCalledWith(dto)
    })
  })

  describe('update', () => {
    it('should delegate to UpdateAcademicCalendarUseCase', async () => {
      const dto: UpdateAcademicCalendarDto = { title: 'Updated' }
      mockUpdate.execute.mockResolvedValue(calendarRow)
      await controller.update('ac-1', dto)
      expect(mockUpdate.execute).toHaveBeenCalledWith('ac-1', dto)
    })
  })

  describe('remove', () => {
    it('should delegate to DeleteAcademicCalendarUseCase', async () => {
      mockDelete.execute.mockResolvedValue(undefined)
      await controller.remove('ac-1')
      expect(mockDelete.execute).toHaveBeenCalledWith('ac-1')
    })
  })

  describe('removeMany', () => {
    it('should delegate to BulkDeleteAcademicCalendarsUseCase', async () => {
      mockBulkDelete.execute.mockResolvedValue({ deleted: 2 })
      await controller.removeMany({ ids: ['ac-1', 'ac-2'] })
      expect(mockBulkDelete.execute).toHaveBeenCalledWith(['ac-1', 'ac-2'])
    })
  })
})
