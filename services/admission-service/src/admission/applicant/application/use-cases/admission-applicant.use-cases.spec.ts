import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { IAdmissionApplicantRepository } from '../../domain/repositories/admission-applicant-repository.js'
import { AdmissionNotificationService } from '../../../notification/index.js'
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
      repo.findMyApplication.mockResolvedValue(null)
      await expect(updateMine.execute('u1', {})).rejects.toThrow(
        NotFoundException,
      )
    })

    it('blocks edits once the application is locked', async () => {
      repo.findMyApplication.mockResolvedValue({
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
      expect(repo.findMyApplication).not.toHaveBeenCalled()
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
