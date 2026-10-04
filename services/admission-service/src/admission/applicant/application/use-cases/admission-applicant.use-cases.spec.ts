import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { IAdmissionApplicantRepository } from '../../domain/repositories/admission-applicant-repository.js'
import { AdmissionNotificationService } from '../../../notification/index.js'
import { IReferenceLookupPort } from '../../../../platform/reference-lookup/reference-lookup.port.js'
import { IRegionLookupPort } from '../../../../platform/region-lookup/region-lookup.port.js'
import { RegisterApplicantUseCase } from './register-applicant/register-applicant.use-case.js'
import { SubmitApplicationUseCase } from './submit-application/submit-application.use-case.js'
import { UpdateMyApplicationUseCase } from './update-my-application/update-my-application.use-case.js'

describe('Admission applicant use-cases', () => {
  const repo = {
    findOpenWave: jest.fn(),
    findActiveWave: jest.fn(),
    isIdentifierTaken: jest.fn(),
    registerApplicant: jest.fn(),
    findMyApplication: jest.fn(),
    findMyDetail: jest.fn(),
    findDetailById: jest.fn(),
    findRequiredActiveDocumentTypes: jest.fn(),
    updateMyApplication: jest.fn(),
    submitApplication: jest.fn(),
  }
  const notifications = { notify: jest.fn() }
  const referenceLookup = {
    optionsByIds: jest
      .fn()
      .mockResolvedValue([{ id: 'ls1', name: 'Masih hidup', isActive: true }]),
  }

  let register: RegisterApplicantUseCase
  let updateMine: UpdateMyApplicationUseCase
  let submit: SubmitApplicationUseCase

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterApplicantUseCase,
        UpdateMyApplicationUseCase,
        SubmitApplicationUseCase,
        { provide: IAdmissionApplicantRepository, useValue: repo },
        { provide: IReferenceLookupPort, useValue: referenceLookup },
        { provide: IRegionLookupPort, useValue: {} },
        { provide: AdmissionNotificationService, useValue: notifications },
      ],
    }).compile()

    register = module.get(RegisterApplicantUseCase)
    updateMine = module.get(UpdateMyApplicationUseCase)
    submit = module.get(SubmitApplicationUseCase)
    jest.clearAllMocks()
  })

  const registerDto = {
    fullName: 'Budi',
    email: 'Budi@Mail.com',
    password: 'secret12',
    passwordConfirm: 'secret12',
    waveId: 'w1',
  }

  describe('RegisterApplicantUseCase', () => {
    it('rejects mismatched password confirmation', async () => {
      await expect(
        register.execute({ ...registerDto, passwordConfirm: 'nope' }),
      ).rejects.toThrow(BadRequestException)
    })

    it('rejects a closed / missing wave', async () => {
      repo.findOpenWave.mockResolvedValue(null)
      await expect(register.execute(registerDto)).rejects.toThrow(
        BadRequestException,
      )
    })

    it('rejects an already-registered email', async () => {
      repo.findOpenWave.mockResolvedValue({ id: 'w1', code: 'G1' })
      repo.isIdentifierTaken.mockResolvedValue(true)
      await expect(register.execute(registerDto)).rejects.toThrow(
        ConflictException,
      )
    })

    it('registers and returns the lower-cased identifier', async () => {
      repo.findOpenWave.mockResolvedValue({ id: 'w1', code: 'G1' })
      repo.isIdentifierTaken.mockResolvedValue(false)
      repo.registerApplicant.mockResolvedValue({
        id: 'app1',
        registrationNumber: 'G1-0001',
      })

      const result = await register.execute(registerDto)

      expect(result).toEqual({
        id: 'app1',
        registrationNumber: 'G1-0001',
        identifier: 'budi@mail.com',
      })
    })

    it('resolves the active wave when waveId is absent', async () => {
      const { waveId: _waveId, ...withoutWave } = registerDto
      const activeWave = { id: 'auto-w1', code: 'AUTO' }
      repo.findActiveWave.mockResolvedValue(activeWave)
      repo.isIdentifierTaken.mockResolvedValue(false)
      repo.registerApplicant.mockResolvedValue({
        id: 'app1',
        registrationNumber: 'AUTO-0001',
      })

      await register.execute(withoutWave)

      expect(repo.findActiveWave).toHaveBeenCalled()
      expect(repo.findOpenWave).not.toHaveBeenCalled()
      expect(repo.registerApplicant).toHaveBeenCalledWith(
        expect.objectContaining({ wave: activeWave }),
      )
    })

    it('rejects registration when no active wave exists', async () => {
      const { waveId: _waveId, ...withoutWave } = registerDto
      repo.findActiveWave.mockResolvedValue(null)

      await expect(register.execute(withoutWave)).rejects.toThrow(
        BadRequestException,
      )
    })

    it('uses findOpenWave and not findActiveWave when waveId is present', async () => {
      repo.findOpenWave.mockResolvedValue({ id: 'w1', code: 'G1' })
      repo.isIdentifierTaken.mockResolvedValue(false)
      repo.registerApplicant.mockResolvedValue({
        id: 'app1',
        registrationNumber: 'G1-0001',
      })

      await register.execute(registerDto)

      expect(repo.findOpenWave).toHaveBeenCalledWith('w1')
      expect(repo.findActiveWave).not.toHaveBeenCalled()
    })
  })

  describe('UpdateMyApplicationUseCase', () => {
    it('throws NotFound when the applicant has no application', async () => {
      repo.findMyDetail.mockResolvedValue(null)
      await expect(updateMine.execute('u1', {})).rejects.toThrow(
        NotFoundException,
      )
    })

    it('blocks edits once the application is locked', async () => {
      repo.findMyDetail.mockResolvedValue({
        id: 'app1',
        status: 'SUBMITTED',
      })
      await expect(updateMine.execute('u1', {})).rejects.toThrow(
        ConflictException,
      )
    })

    it('reads an application by id for an administrator, not by user', async () => {
      repo.findDetailById.mockResolvedValue(null)

      await expect(
        updateMine.executeForApplication('app1', {}),
      ).rejects.toThrow(NotFoundException)
      expect(repo.findMyDetail).not.toHaveBeenCalled()
    })

    it('refuses an on-behalf edit when the application is locked', async () => {
      repo.findDetailById.mockResolvedValue({
        id: 'app1',
        status: 'SUBMITTED',
      })

      await expect(
        updateMine.executeForApplication('app1', {}),
      ).rejects.toThrow(ConflictException)
    })
  })

  describe('SubmitApplicationUseCase', () => {
    const complete = {
      id: 'app1',
      userId: 'u1',
      status: 'DRAFT',
      fullName: 'Budi',
      gender: 'MALE',
      birthPlace: 'Garut',
      birthDate: new Date('2015-05-05'),
      nik: '3205010101150001',
      religionId: 'rel1',
      street: 'Jl. Pesantren 1',
      rt: '01',
      rw: '02',
      provinceCode: '32',
      regencyCode: '32.05',
      districtCode: '32.05.10',
      villageCode: '32.05.10.2001',
      studentResidenceId: 'sr1',
      travelDistanceId: 'td1',
      travelTimeId: 'tt1',
      transportationId: 'tr1',
      financingSourceId: 'fs1',
      previousSchoolName: 'MI Al-Ikhlash',
      graduationYear: 2026,
      wave: { endDate: new Date('2026-02-01T00:00:00.000Z') },
      parents: [
        {
          id: 'p1',
          relation: 'FATHER',
          name: 'Ahmad',
          nik: '3205010101800001',
          birthPlace: 'Garut',
          birthDate: new Date('1980-01-01'),
          occupationId: 'occ1',
          phone: '081234567890',
          lifeStatusId: 'ls1',
          isPrimary: true,
        },
        {
          id: 'p2',
          relation: 'MOTHER',
          name: 'Siti',
          nik: '3205014101820002',
          lifeStatusId: 'ls1',
          isPrimary: false,
        },
      ],
      documents: [],
      payment: { status: 'UNPAID', proofFileId: null },
    }

    beforeEach(() => {
      jest.useFakeTimers({ now: new Date('2026-01-15T10:00:00+07:00') })
      repo.findRequiredActiveDocumentTypes.mockResolvedValue([])
      repo.submitApplication.mockResolvedValue({
        ...complete,
        status: 'SUBMITTED',
      })
    })

    afterEach(() => jest.useRealTimers())

    it('accepts a submission on the last day of the wave', async () => {
      jest.setSystemTime(new Date('2026-02-01T15:00:00+07:00'))
      repo.findMyDetail.mockResolvedValue(complete)

      await submit.execute('u1')

      expect(repo.submitApplication).toHaveBeenCalled()
    })

    it('refuses a submission the day after the wave ends', async () => {
      jest.setSystemTime(new Date('2026-02-02T08:00:00+07:00'))
      repo.findMyDetail.mockResolvedValue(complete)

      await expect(submit.execute('u1')).rejects.toThrow(ConflictException)
    })

    it('submits before the payment proof, which can follow and is reviewed by an administrator', async () => {
      repo.findMyDetail.mockResolvedValue(complete)

      await submit.execute('u1')

      expect(repo.submitApplication).toHaveBeenCalled()
    })

    it('names a required document that is missing or was rejected', async () => {
      repo.findMyDetail.mockResolvedValue({
        ...complete,
        documents: [{ documentTypeId: 'dt2', status: 'REJECTED' }],
      })
      repo.findRequiredActiveDocumentTypes.mockResolvedValue([
        { id: 'dt1', name: 'Kartu Keluarga' },
        { id: 'dt2', name: 'Akta Kelahiran' },
      ])

      await expect(submit.execute('u1')).rejects.toThrow(
        'Berkas Kartu Keluarga, Berkas Akta Kelahiran (ditolak, unggah ulang)',
      )
      expect(repo.submitApplication).not.toHaveBeenCalled()
    })

    it('lists missing requirements before allowing submission', async () => {
      repo.findMyDetail.mockResolvedValue({
        id: 'app1',
        status: 'DRAFT',
        wave: { endDate: new Date('2999-01-01') },
        parents: [],
        documents: [],
        payment: null,
      })
      repo.findRequiredActiveDocumentTypes.mockResolvedValue([])

      await expect(submit.execute('u1')).rejects.toThrow(BadRequestException)
      await expect(submit.execute('u1')).rejects.toThrow(
        /^Data belum lengkap: Nama lengkap, /,
      )
    })

    it.each([
      ['studentResidenceId', 'Status tempat tinggal'],
      ['travelDistanceId', 'Jarak tempat tinggal'],
      ['travelTimeId', 'Waktu tempuh'],
      ['transportationId', 'Transportasi'],
      ['financingSourceId', 'Yang membiayai sekolah'],
      ['nik', 'NIK'],
      ['religionId', 'Agama'],
      ['previousSchoolName', 'Nama sekolah asal'],
      ['graduationYear', 'Tahun lulus'],
    ])('names the missing %s', async (field, label) => {
      repo.findMyDetail.mockResolvedValue({ ...complete, [field]: null })

      await expect(submit.execute('u1')).rejects.toThrow(label)
      expect(repo.submitApplication).not.toHaveBeenCalled()
    })

    it.each(['provinceCode', 'regencyCode', 'districtCode', 'villageCode'])(
      'names the address region when %s is missing',
      async (field) => {
        repo.findMyDetail.mockResolvedValue({ ...complete, [field]: null })

        await expect(submit.execute('u1')).rejects.toThrow(
          'Wilayah alamat (provinsi s.d. desa/kelurahan)',
        )
      },
    )

    it.each([
      ['FATHER', 'Data ayah'],
      ['MOTHER', 'Data ibu'],
    ])('requires the %s', async (relation, label) => {
      repo.findMyDetail.mockResolvedValue({
        ...complete,
        parents: complete.parents.filter((p) => p.relation !== relation),
      })

      await expect(submit.execute('u1')).rejects.toThrow(label)
    })

    it('names what the guardian lacks', async () => {
      repo.findMyDetail.mockResolvedValue({
        ...complete,
        parents: complete.parents.map((p) =>
          p.isPrimary ? { ...p, phone: null } : p,
        ),
      })

      await expect(submit.execute('u1')).rejects.toThrow('No. HP wali')
      expect(repo.submitApplication).not.toHaveBeenCalled()
    })

    it.each([
      ['FATHER', 'Status ayah'],
      ['MOTHER', 'Status ibu'],
    ])('requires the life status of the %s', async (relation, label) => {
      repo.findMyDetail.mockResolvedValue({
        ...complete,
        parents: complete.parents.map((p) =>
          p.relation === relation ? { ...p, lifeStatusId: null } : p,
        ),
      })

      await expect(submit.execute('u1')).rejects.toThrow(label)
    })

    it('does not ask for a guardian', async () => {
      repo.findMyDetail.mockResolvedValue(complete)

      await submit.execute('u1')

      expect(repo.submitApplication).toHaveBeenCalled()
    })

    it('submits an application resolved by id', async () => {
      repo.findDetailById.mockResolvedValue(null)

      await expect(submit.executeForApplication('app1')).rejects.toThrow(
        NotFoundException,
      )
      expect(repo.findMyDetail).not.toHaveBeenCalled()
    })

    it('refuses an on-behalf submit that is not editable', async () => {
      repo.findDetailById.mockResolvedValue({
        id: 'app1',
        status: 'VERIFIED',
        wave: { endDate: new Date('2999-01-01') },
        parents: [],
        documents: [],
        payment: null,
      })

      await expect(submit.executeForApplication('app1')).rejects.toThrow(
        ConflictException,
      )
    })
  })
})
