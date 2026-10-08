import { BadRequestException } from '@nestjs/common'
import { EnrollApplicantUseCase } from './enroll-applicant.use-case.js'

const application = (overrides: Record<string, unknown> = {}) => ({
  id: 'app1',
  userId: 'u1',
  status: 'ACCEPTED',
  registrationNumber: 'G1-0001',
  fullName: 'Ahmad',
  gender: 'MALE',
  birthPlace: 'Bandung',
  birthDate: new Date('2012-01-01'),
  nik: '3201000000000001',
  nisn: '0091234567',
  nis: '262707001',
  targetGradeId: 'g7',
  parents: [],
  ...overrides,
})

function setup(found = application()) {
  const repository = {
    findActiveWithParentsAndUser: jest.fn().mockResolvedValue(found),
    setNis: jest.fn().mockResolvedValue(undefined),
    setEnrolling: jest.fn().mockResolvedValue(undefined),
    markEnrolled: jest
      .fn()
      .mockResolvedValue({ id: 'app1', status: 'ENROLLED' }),
  }
  const notifications = { notify: jest.fn().mockResolvedValue(undefined) }
  const enrolment = {
    enrol: jest.fn().mockResolvedValue({
      studentId: 's1',
      parentsLinked: 0,
      enrollmentCreated: false,
      alreadyEnrolled: false,
    }),
  }
  return {
    repository,
    notifications,
    enrolment,
    useCase: new EnrollApplicantUseCase(
      repository as never,
      notifications as never,
      enrolment as never,
    ),
  }
}

describe('EnrollApplicantUseCase fallbacks', () => {
  it('takes the NIS, NISN and grade from the application when the request omits them', async () => {
    const { useCase, enrolment, notifications } = setup()

    await useCase.execute('app1', {}, 'tok')

    expect(enrolment.enrol).toHaveBeenCalledWith(
      expect.objectContaining({
        nis: '262707001',
        nisn: '0091234567',
        gradeId: 'g7',
      }),
      'tok',
    )
    expect(notifications.notify).toHaveBeenCalledWith(
      'app1',
      'STATUS_CHANGE',
      'Selamat bergabung sebagai santri',
      expect.stringContaining('262707001'),
    )
  })

  it('lets the request override the application', async () => {
    const { useCase, enrolment } = setup()

    await useCase.execute(
      'app1',
      { nis: '999', nisn: '111', gradeId: 'g8' },
      'tok',
    )

    expect(enrolment.enrol).toHaveBeenCalledWith(
      expect.objectContaining({ nis: '999', nisn: '111', gradeId: 'g8' }),
      'tok',
    )
  })

  it.each([
    [{ nis: null }, 'NIS belum disusun'],
    [{ nisn: null }, 'NISN belum diisi'],
    [{ targetGradeId: null }, 'Tingkat kelas tujuan belum diisi'],
  ])('refuses %j before touching the status', async (missing, message) => {
    const { useCase, repository, enrolment } = setup(application(missing))

    await expect(useCase.execute('app1', {}, 'tok')).rejects.toThrow(
      new BadRequestException(message),
    )
    expect(repository.setEnrolling).not.toHaveBeenCalled()
    expect(enrolment.enrol).not.toHaveBeenCalled()
  })

  it('stores a typed NIS on the application before enrolling, so compose never overwrites it', async () => {
    const { useCase, repository } = setup()
    const order: string[] = []
    repository.setNis.mockImplementation(() => {
      order.push('setNis')
      return Promise.resolve()
    })
    repository.setEnrolling.mockImplementation(() => {
      order.push('setEnrolling')
      return Promise.resolve()
    })

    await useCase.execute('app1', { nis: '999' }, 'tok')

    expect(repository.setNis).toHaveBeenCalledWith('app1', '999')
    expect(order).toEqual(['setNis', 'setEnrolling'])
  })

  it('does not write the NIS when it equals the stored one', async () => {
    const { useCase, repository } = setup()

    await useCase.execute('app1', { nis: '262707001' }, 'tok')

    expect(repository.setNis).not.toHaveBeenCalled()
  })
})
