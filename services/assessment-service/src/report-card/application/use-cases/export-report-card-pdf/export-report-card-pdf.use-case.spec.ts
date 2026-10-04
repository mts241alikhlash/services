import { BadRequestException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { ISchoolUnitIdentityReadPort } from '../../../../platform/school-unit-identity/school-unit-identity.port.js'
import { IAttendanceRepository } from '../../../../attendance/domain/repositories/attendance.repository.js'
import { IReportCardRepository } from '../../../domain/repositories/report-card.repository.js'
import { PdfService } from '../../services/pdf.service.js'
import { ExportReportCardPdfUseCase } from './export-report-card-pdf.use-case.js'

jest.mock('../../services/pdf.service.js', () => ({
  PdfService: jest.fn(),
}))

describe('ExportReportCardPdfUseCase', () => {
  let useCase: ExportReportCardPdfUseCase

  const mockRepo = { findById: jest.fn() }
  const mockAttendanceRepository = { getStatusCounts: jest.fn() }
  const mockPdfService = { generatePdf: jest.fn() }
  const mockSchoolUnitIdentityReadPort = { findSchoolUnitProfile: jest.fn() }

  const baseReportCard = {
    id: 'rap-1',
    enrollmentId: 'enr-1',
    isPublished: true,
    employeeNote: 'A diligent student.',
    subjects: [
      {
        subjectId: 'subj-2',
        subjectCode: 'IPA',
        subjectName: 'IPA',
        score: 90,
        passingScore: 75,
        predicate: 'A',
        description: 'Sangat Baik',
        isComplete: true,
      },
    ],
    enrollment: {
      student: { nis: '12345', user: { profile: { name: 'Budi' } } },
      classroom: { name: 'VII A' },
      semester: {
        type: { name: 'ODD' },
        academicYear: { name: '2025/2026' },
      },
    },
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportReportCardPdfUseCase,
        { provide: IReportCardRepository, useValue: mockRepo },
        { provide: IAttendanceRepository, useValue: mockAttendanceRepository },
        { provide: PdfService, useValue: mockPdfService },
        {
          provide: ISchoolUnitIdentityReadPort,
          useValue: mockSchoolUnitIdentityReadPort,
        },
      ],
    }).compile()

    useCase = module.get<ExportReportCardPdfUseCase>(ExportReportCardPdfUseCase)
    jest.clearAllMocks()

    mockAttendanceRepository.getStatusCounts.mockResolvedValue({
      sick: 0,
      excused: 0,
      absent: 0,
    })
    mockSchoolUnitIdentityReadPort.findSchoolUnitProfile.mockResolvedValue({
      name: 'MTs Persis 241',
      email: 'info@mts241alikhlash.sch.id',
      phone: null,
    })
    mockPdfService.generatePdf.mockResolvedValue(Buffer.from('pdf'))
  })

  it('should throw NotFoundException when the report card does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null)

    await expect(useCase.execute('rap-missing')).rejects.toThrow(
      NotFoundException,
    )
    expect(mockAttendanceRepository.getStatusCounts).not.toHaveBeenCalled()
  })

  it('should throw BadRequestException when the report card is not published', async () => {
    mockRepo.findById.mockResolvedValue({
      ...baseReportCard,
      isPublished: false,
    })

    await expect(useCase.execute('rap-1')).rejects.toThrow(BadRequestException)
    expect(mockAttendanceRepository.getStatusCounts).not.toHaveBeenCalled()
  })

  it('reads attendance for the enrollment and generates a PDF', async () => {
    mockRepo.findById.mockResolvedValue(baseReportCard)

    const result = await useCase.execute('rap-1')

    expect(mockAttendanceRepository.getStatusCounts).toHaveBeenCalledWith(
      'enr-1',
    )
    expect(mockPdfService.generatePdf).toHaveBeenCalledWith(expect.any(String))
    expect(result).toEqual(Buffer.from('pdf'))
  })

  it('prints the stored lines rather than recalculating them', async () => {
    mockRepo.findById.mockResolvedValue(baseReportCard)

    await useCase.execute('rap-1')

    const html = mockPdfService.generatePdf.mock.calls[0][0] as string
    expect(html).toContain('IPA')
    expect(html).toContain('90.00')
    expect(html).toContain('Sangat Baik')
    expect(html).not.toContain('Matematika')
  })

  it('prints an empty subject table when the card was generated with no scores', async () => {
    mockRepo.findById.mockResolvedValue({ ...baseReportCard, subjects: [] })

    await expect(useCase.execute('rap-1')).resolves.toEqual(Buffer.from('pdf'))
  })

  it('should fall back to default school info when the school unit has not been set up', async () => {
    mockRepo.findById.mockResolvedValue(baseReportCard)
    mockSchoolUnitIdentityReadPort.findSchoolUnitProfile.mockResolvedValue(null)

    await useCase.execute('rap-1')

    const html = mockPdfService.generatePdf.mock.calls[0][0] as string
    expect(html).toContain('SIAKAD Sekolah')
  })
})
