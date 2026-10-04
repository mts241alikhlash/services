import { AdmissionAnnouncementResponseDto } from '../../../../../announcement/presentation/http/dto/response/admission-announcement-response.dto.js'
import {
  MyAdmissionApplicationResponseDto,
  MyAdmissionApplicationResponseWaveDto,
} from './admission-application-response.dto.js'

const wave = {
  id: 'wave-1',
  academicYearId: 'year-1',
  code: 'W1',
  name: 'Gelombang 1',
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-02-01'),
  quota: 100,
  registrationFee: 100000,
  description: null,
  isActive: true,
  lastRegistrationSeq: 0,
  deletedAt: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
}

describe('admission response DTOs', () => {
  it('keeps the academic year the reader attaches to an application wave', () => {
    const dto = MyAdmissionApplicationResponseWaveDto.fromDomain({
      ...wave,
      academicYear: { id: 'year-1', name: '2026/2027' },
    })

    expect(dto.academicYear).toEqual({ id: 'year-1', name: '2026/2027' })
  })

  it('keeps the wave an announcement is scoped to', () => {
    const dto = AdmissionAnnouncementResponseDto.fromDomain({
      id: 'ann-1',
      title: 'Jadwal tes',
      content: 'Tes dimulai pukul 08.00',
      waveId: 'wave-1',
      wave: { id: 'wave-1', name: 'Gelombang 1', code: 'W1' },
    })

    expect(dto.wave).toEqual({ id: 'wave-1', name: 'Gelombang 1', code: 'W1' })
  })

  describe('an application form', () => {
    const file = {
      id: 'file-1',
      filename: 'a.pdf',
      originalName: 'piagam.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1024,
      storageKey: 'attachments/a.pdf',
    }
    const parent = {
      id: 'parent-1',
      applicationId: 'app-1',
      relation: 'FATHER' as const,
      name: 'Budi',
      nik: null,
      birthPlace: null,
      birthDate: null,
      phone: null,
      occupationId: 'occ-1',
      educationId: 'edu-1',
      incomeRangeId: 'inc-1',
      lifeStatusId: 'life-1',
      domicileId: 'dom-1',
      residenceId: 'res-1',
      sameAddressAsStudent: false,
      street: 'Jl. Mawar',
      rt: '01',
      rw: '02',
      village: 'PARUNGSERAB',
      district: 'SOREANG',
      city: 'KAB. BANDUNG',
      province: 'JAWA BARAT',
      postalCode: '40911',
      provinceCode: '32',
      regencyCode: '32.04',
      districtCode: '32.04.10',
      villageCode: '32.04.10.2001',
      isPrimary: true,
      occupation: { id: 'occ-1', name: 'Petani' },
      education: { id: 'edu-1', name: 'SMA' },
    }
    const domain = {
      id: 'app-1',
      userId: 'user-1',
      waveId: 'wave-1',
      status: 'DRAFT' as const,
      documentTypes: [],
      hobby: 'Membaca',
      aspiration: 'Dokter',
      financingSourceId: 'fin-1',
      disabilityTypeId: null,
      specialNeedId: null,
      studentResidenceId: 'sres-1',
      travelDistanceId: 'dist-1',
      travelTimeId: 'time-1',
      transportationId: 'trans-1',
      provinceCode: '32',
      regencyCode: '32.04',
      districtCode: '32.04.10',
      villageCode: '32.04.10.2001',
      parents: [parent],
      achievements: [
        {
          id: 'ach-1',
          sortOrder: 0,
          year: 2025,
          competitionName: 'OSN',
          competitionFieldId: 'field-1',
          organizer: null,
          competitionLevelId: 'level-1',
          rank: 'Juara 1',
          fileId: 'file-1',
          file,
        },
      ],
      scholarships: [
        {
          id: 'sch-1',
          sortOrder: 0,
          year: 2025,
          categoryId: 'cat-1',
          scholarshipName: 'PIP',
          providerName: null,
          providerTypeId: 'prov-1',
          duration: '1 tahun',
          kipNumber: 'KIP123',
          amount: '450000.00',
          fileId: null,
          file: null,
        },
      ],
    }
    const dto = MyAdmissionApplicationResponseDto.fromDomain(
      domain as unknown as Parameters<
        typeof MyAdmissionApplicationResponseDto.fromDomain
      >[0],
    )

    it('carries the student fields', () => {
      expect(dto).toMatchObject({
        hobby: 'Membaca',
        aspiration: 'Dokter',
        financingSourceId: 'fin-1',
        disabilityTypeId: null,
        studentResidenceId: 'sres-1',
        travelDistanceId: 'dist-1',
        travelTimeId: 'time-1',
        transportationId: 'trans-1',
        provinceCode: '32',
        villageCode: '32.04.10.2001',
      })
    })

    it('carries what a parent keeps across saves', () => {
      expect(dto.parents?.[0]).toMatchObject({
        occupationId: 'occ-1',
        educationId: 'edu-1',
        incomeRangeId: 'inc-1',
        lifeStatusId: 'life-1',
        domicileId: 'dom-1',
        residenceId: 'res-1',
        sameAddressAsStudent: false,
        street: 'Jl. Mawar',
        postalCode: '40911',
        villageCode: '32.04.10.2001',
      })
    })

    it('carries an achievement with its file', () => {
      expect(dto.achievements?.[0]).toMatchObject({
        year: 2025,
        competitionName: 'OSN',
        competitionFieldId: 'field-1',
        rank: 'Juara 1',
        file: { id: 'file-1', originalName: 'piagam.pdf' },
      })
    })

    it('carries a scholarship with its amount as a number', () => {
      expect(dto.scholarships?.[0]).toMatchObject({
        scholarshipName: 'PIP',
        categoryId: 'cat-1',
        duration: '1 tahun',
        kipNumber: 'KIP123',
        amount: 450000,
        file: null,
      })
    })
  })
})
