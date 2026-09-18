import { BadRequestException, ConflictException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { IAdmissionApplicationRepository } from '../../domain/repositories/admission-application-repository.js'
import { AdmissionNotificationService } from '../../../notification/index.js'
import { AcceptApplicationUseCase } from './accept-application/accept-application.use-case.js'
import { EnrollApplicantUseCase } from './enroll-applicant/enroll-applicant.use-case.js'
import { IStudentEnrolmentPort } from '../../infrastructure/integration/student-enrolment.port.js'
import { RejectApplicationUseCase } from './reject-application/reject-application.use-case.js'
import { VerifyApplicationUseCase } from './verify-application/verify-application.use-case.js'

describe('Admission workflow use-cases', () => {
  const repo = {
    findActiveById: jest.fn(),
    findActiveWithWave: jest.fn(),
    findActiveWithDocsAndPayment: jest.fn(),
    findActiveWithParentsAndUser: jest.fn(),
    countAcceptedInWave: jest.fn(),
    findRequiredActiveDocumentTypes: jest.fn(),
    setVerified: jest.fn(),
    setAccepted: jest.fn(),
    setRejected: jest.fn(),
    setEnrolling: jest.fn(),
    markEnrolled: jest.fn(),
  }
  const notifications = { notify: jest.fn() }
  const enrolment = { enrol: jest.fn() }

  let accept: AcceptApplicationUseCase
  let reject: RejectApplicationUseCase
  let verifyApp: VerifyApplicationUseCase
  let enroll: EnrollApplicantUseCase

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AcceptApplicationUseCase,
        RejectApplicationUseCase,
        VerifyApplicationUseCase,
        EnrollApplicantUseCase,
        { provide: IAdmissionApplicationRepository, useValue: repo },
        { provide: AdmissionNotificationService, useValue: notifications },
        { provide: IStudentEnrolmentPort, useValue: enrolment },
      ],
    }).compile()

    accept = module.get(AcceptApplicationUseCase)
    reject = module.get(RejectApplicationUseCase)
    verifyApp = module.get(VerifyApplicationUseCase)
    enroll = module.get(EnrollApplicantUseCase)
    jest.clearAllMocks()
  })

  describe('AcceptApplicationUseCase', () => {
    it('flags a quota warning and notifies on acceptance', async () => {
      repo.findActiveWithWave.mockResolvedValue({
        id: 'app1',
        status: 'VERIFIED',
        waveId: 'w1',
        wave: { quota: 10 },
      })
      repo.countAcceptedInWave.mockResolvedValue(10)
      repo.setAccepted.mockResolvedValue({ id: 'app1', status: 'ACCEPTED' })

      const result = await accept.execute('app1', {}, 'admin1')

      expect(result.quotaWarning).toContain('Wave quota')
      expect(notifications.notify).toHaveBeenCalled()
    })
  })

  describe('VerifyApplicationUseCase', () => {
    it('blocks verification when a required document is not approved', async () => {
      repo.findActiveWithDocsAndPayment.mockResolvedValue({
        id: 'app1',
        status: 'SUBMITTED',
        documents: [{ documentTypeId: 'dt1', status: 'PENDING' }],
        payment: { status: 'VERIFIED' },
      })
      repo.findRequiredActiveDocumentTypes.mockResolvedValue([
        { id: 'dt1', name: 'KK' },
      ])

      await expect(verifyApp.execute('app1', 'admin1')).rejects.toThrow(
        ConflictException,
      )
    })

    it('blocks verification when payment is not verified', async () => {
      repo.findActiveWithDocsAndPayment.mockResolvedValue({
        id: 'app1',
        status: 'SUBMITTED',
        documents: [{ documentTypeId: 'dt1', status: 'APPROVED' }],
        payment: { status: 'PENDING' },
      })
      repo.findRequiredActiveDocumentTypes.mockResolvedValue([
        { id: 'dt1', name: 'KK' },
      ])

      await expect(verifyApp.execute('app1', 'admin1')).rejects.toThrow(
        ConflictException,
      )
    })
  })

  describe('RejectApplicationUseCase', () => {
    it('rejects a submitted application and notifies', async () => {
      repo.findActiveById.mockResolvedValue({
        id: 'app1',
        status: 'SUBMITTED',
      })
      repo.setRejected.mockResolvedValue({ id: 'app1', status: 'REJECTED' })

      await reject.execute('app1', { reason: 'Berkas palsu' }, 'admin1')

      expect(repo.setRejected).toHaveBeenCalledWith({
        id: 'app1',
        adminId: 'admin1',
        reason: 'Berkas palsu',
      })
      expect(notifications.notify).toHaveBeenCalled()
    })
  })

  describe('EnrollApplicantUseCase', () => {
    const acceptedApplication = {
      id: 'app1',
      status: 'ACCEPTED',
      registrationNumber: 'REG-1',
      gender: 'MALE',
      birthPlace: 'Bandung',
      birthDate: new Date('2010-01-01'),
      nik: '123',
      parents: [],
      userId: 'u1',
      user: { id: 'u1' },
    }

    it('rejects enrollment when personal data is incomplete', async () => {
      repo.findActiveWithParentsAndUser.mockResolvedValue({
        ...acceptedApplication,
        birthPlace: null,
      })

      await expect(
        enroll.execute(
          'app1',
          { nis: '1', nisn: '2', gradeId: 'grade-1' },
          'operator-token',
        ),
      ).rejects.toThrow(BadRequestException)
    })

    it('does not mark the application enrolled when academic refuses', async () => {
      repo.findActiveWithParentsAndUser.mockResolvedValue(acceptedApplication)
      enrolment.enrol.mockRejectedValue(
        new ConflictException('NIS 1 is already in use'),
      )

      await expect(
        enroll.execute(
          'app1',
          { nis: '1', nisn: '2', gradeId: 'grade-1' },
          'operator-token',
        ),
      ).rejects.toThrow(ConflictException)
      expect(repo.markEnrolled).not.toHaveBeenCalled()
    })

    it('enrols through academic, then marks the application', async () => {
      repo.findActiveWithParentsAndUser.mockResolvedValue(acceptedApplication)
      enrolment.enrol.mockResolvedValue({
        studentId: 's1',
        parentsLinked: 0,
        enrollmentCreated: false,
        alreadyEnrolled: false,
      })
      repo.markEnrolled.mockResolvedValue({ id: 'app1', status: 'ENROLLED' })

      const dto = { nis: '1', nisn: '2', gradeId: 'grade-1' }
      const result = await enroll.execute('app1', dto, 'operator-token')

      expect(enrolment.enrol).toHaveBeenCalledWith(
        expect.objectContaining({
          applicationId: 'app1',
          userId: 'u1',
          nis: '1',
          nisn: '2',
          profile: expect.objectContaining({ nik: '123' }),
        }),
        'operator-token',
      )
      expect(repo.markEnrolled).toHaveBeenCalledWith('app1', 's1')
      expect(notifications.notify).toHaveBeenCalled()
      expect(result.student.id).toBe('s1')
    })

    it('retries after remote success when local admission completion fails', async () => {
      repo.findActiveWithParentsAndUser
        .mockResolvedValueOnce(acceptedApplication)
        .mockResolvedValueOnce({ ...acceptedApplication, status: 'ENROLLING' })
      repo.setEnrolling.mockResolvedValue({
        ...acceptedApplication,
        status: 'ENROLLING',
      })
      enrolment.enrol
        .mockResolvedValueOnce({
          studentId: 's1',
          parentsLinked: 0,
          enrollmentCreated: true,
          alreadyEnrolled: false,
        })
        .mockResolvedValueOnce({
          studentId: 's1',
          parentsLinked: 0,
          enrollmentCreated: false,
          alreadyEnrolled: true,
        })
      repo.markEnrolled
        .mockRejectedValueOnce(new Error('admission database unavailable'))
        .mockResolvedValueOnce({ id: 'app1', status: 'ENROLLED' })

      await expect(
        enroll.execute(
          'app1',
          { nis: '1', nisn: '2', gradeId: 'grade-1' },
          'operator-token',
        ),
      ).rejects.toThrow('admission database unavailable')

      const result = await enroll.execute(
        'app1',
        { nis: '1', nisn: '2', gradeId: 'grade-1' },
        'operator-token',
      )

      expect(enrolment.enrol).toHaveBeenCalledTimes(2)
      expect(enrolment.enrol).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ applicationId: 'app1', userId: 'u1' }),
        'operator-token',
      )
      expect(repo.markEnrolled).toHaveBeenCalledTimes(2)
      expect(notifications.notify).toHaveBeenCalledTimes(1)
      expect(result.student.id).toBe('s1')
    })

    it('persists enrolling before calling student-service', async () => {
      repo.findActiveWithParentsAndUser.mockResolvedValue(acceptedApplication)
      repo.setEnrolling.mockResolvedValue({
        ...acceptedApplication,
        status: 'ENROLLING',
      })
      enrolment.enrol.mockResolvedValue({
        studentId: 's1',
        parentsLinked: 0,
        enrollmentCreated: false,
        alreadyEnrolled: false,
      })
      repo.markEnrolled.mockResolvedValue({ id: 'app1', status: 'ENROLLED' })

      await enroll.execute(
        'app1',
        { nis: '1', nisn: '2', gradeId: 'grade-1' },
        'operator-token',
      )

      expect(repo.setEnrolling).toHaveBeenCalledWith('app1')
      expect(repo.setEnrolling.mock.invocationCallOrder[0]).toBeLessThan(
        enrolment.enrol.mock.invocationCallOrder[0],
      )
    })

    it('retries an application already in enrolling', async () => {
      repo.findActiveWithParentsAndUser.mockResolvedValue({
        ...acceptedApplication,
        status: 'ENROLLING',
      })
      enrolment.enrol.mockResolvedValue({
        studentId: 's1',
        parentsLinked: 0,
        enrollmentCreated: false,
        alreadyEnrolled: true,
      })
      repo.markEnrolled.mockResolvedValue({ id: 'app1', status: 'ENROLLED' })

      const result = await enroll.execute(
        'app1',
        { nis: '1', nisn: '2', gradeId: 'grade-1' },
        'operator-token',
      )

      expect(enrolment.enrol).toHaveBeenCalled()
      expect(repo.markEnrolled).toHaveBeenCalledWith('app1', 's1')
      expect(result.student.id).toBe('s1')
    })

    it('does not complete or notify when a retryable remote call fails', async () => {
      repo.findActiveWithParentsAndUser.mockResolvedValue({
        ...acceptedApplication,
        status: 'ENROLLING',
      })
      enrolment.enrol.mockRejectedValue(
        new ConflictException('student unavailable'),
      )

      await expect(
        enroll.execute(
          'app1',
          { nis: '1', nisn: '2', gradeId: 'grade-1' },
          'operator-token',
        ),
      ).rejects.toThrow(ConflictException)
      expect(repo.markEnrolled).not.toHaveBeenCalled()
      expect(notifications.notify).not.toHaveBeenCalled()
    })

    it('keeps enrolled terminal and does not call student-service', async () => {
      repo.findActiveWithParentsAndUser.mockResolvedValue({
        ...acceptedApplication,
        status: 'ENROLLED',
      })

      await expect(
        enroll.execute(
          'app1',
          { nis: '1', nisn: '2', gradeId: 'grade-1' },
          'operator-token',
        ),
      ).rejects.toThrow(ConflictException)
      expect(enrolment.enrol).not.toHaveBeenCalled()
      expect(repo.markEnrolled).not.toHaveBeenCalled()
    })
  })
})
