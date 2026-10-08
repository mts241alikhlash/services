import { BadRequestException, ConflictException } from '@nestjs/common'
import { SubmitApplicationUseCase } from './submit-application.use-case.js'

function parent(relation: string, nik: string, isPrimary: boolean) {
  return {
    relation,
    name: `Nama ${relation}`,
    nik,
    birthPlace: 'Bandung',
    birthDate: new Date('1980-01-01'),
    occupationId: 'job1',
    phone: '08123456789',
    lifeStatusId: 'alive',
    isPrimary,
  }
}

function completeApplication(overrides: Record<string, unknown> = {}) {
  return {
    id: 'app1',
    status: 'REVISION_NEEDED',
    fullName: 'Ahmad',
    gender: 'MALE',
    birthPlace: 'Bandung',
    birthDate: new Date('2012-01-01'),
    nik: '3201000000000001',
    religionId: 'r1',
    street: 'Jl. Mawar',
    rt: '01',
    rw: '02',
    studentResidenceId: 'x',
    travelDistanceId: 'x',
    travelTimeId: 'x',
    transportationId: 'x',
    financingSourceId: 'x',
    previousSchoolName: 'SD 1',
    graduationYear: 2026,
    provinceCode: '32',
    regencyCode: '3273',
    districtCode: '327301',
    villageCode: '3273011001',
    wave: { endDate: new Date('2999-01-01') },
    parents: [
      parent('FATHER', '3201000000000002', true),
      parent('MOTHER', '3201000000000003', false),
    ],
    documents: [{ documentTypeId: 'kk', status: 'APPROVED' }],
    ...overrides,
  }
}

function setup(application = completeApplication()) {
  const applicants = {
    findMyDetail: jest.fn().mockResolvedValue(application),
    findRequiredActiveDocumentTypes: jest
      .fn()
      .mockResolvedValue([{ id: 'kk', name: 'Kartu Keluarga' }]),
    submitApplication: jest
      .fn()
      .mockResolvedValue({ ...application, status: 'SUBMITTED' }),
    findDetailById: jest.fn().mockResolvedValue({
      ...application,
      status: 'VERIFIED',
      verifiedAt: new Date('2026-10-08T00:00:00Z'),
    }),
  }
  const notifications = { notify: jest.fn().mockResolvedValue(undefined) }
  const referenceLookup = {
    optionsByIds: jest
      .fn()
      .mockResolvedValue([{ id: 'alive', name: 'Masih hidup' }]),
  }
  const verification = { execute: jest.fn().mockResolvedValue(true) }
  const useCase = new SubmitApplicationUseCase(
    applicants as never,
    notifications as never,
    referenceLookup as never,
    verification as never,
  )
  return { useCase, applicants, notifications, verification }
}

describe('SubmitApplicationUseCase automatic verification', () => {
  it('verifies at once when a data-only revision is resubmitted and nothing is left to review', async () => {
    const { useCase, verification, notifications } = setup()

    await useCase.execute('user1')

    expect(verification.execute).toHaveBeenCalledWith('app1', null)
    expect(notifications.notify).toHaveBeenCalledWith(
      'app1',
      'STATUS_CHANGE',
      'Formulir berhasil dikirim',
      expect.any(String),
    )
  })

  it('answers with the stored application once it was verified', async () => {
    const { useCase, applicants } = setup()

    const result = await useCase.execute('user1')

    expect(applicants.findDetailById).toHaveBeenCalledWith('app1')
    expect(result.status).toBe('VERIFIED')
    expect(result.verifiedAt).toEqual(new Date('2026-10-08T00:00:00Z'))
  })

  it('does not try when the form is incomplete', async () => {
    const { useCase, verification, applicants } = setup(
      completeApplication({ street: null }),
    )

    await expect(useCase.execute('user1')).rejects.toBeInstanceOf(
      BadRequestException,
    )
    expect(applicants.submitApplication).not.toHaveBeenCalled()
    expect(verification.execute).not.toHaveBeenCalled()
  })

  it('never lets a rejected applicant back into review by submitting', async () => {
    const { useCase, applicants, verification } = setup(
      completeApplication({ status: 'REJECTED' }),
    )

    await expect(useCase.execute('user1')).rejects.toBeInstanceOf(
      ConflictException,
    )
    expect(applicants.submitApplication).not.toHaveBeenCalled()
    expect(verification.execute).not.toHaveBeenCalled()
  })
})
