import { BadRequestException } from '@nestjs/common'
import { RegisterApplicantUseCase } from './register-applicant.use-case.js'

jest.mock('../../../../../shared/utils/hash.helper.js', () => ({
  hashPassword: jest.fn().mockResolvedValue('hash'),
}))

function setup(
  grades: { id: string; level: number; name: string | null }[] = [],
) {
  const repository = {
    findActiveWave: jest
      .fn()
      .mockResolvedValue({ id: 'w1', code: 'G1', registrationFee: 100000 }),
    findOpenWave: jest.fn(),
    isWaveFull: jest.fn().mockResolvedValue(false),
    isIdentifierTaken: jest.fn().mockResolvedValue(false),
    registerApplicant: jest
      .fn()
      .mockResolvedValue({ id: 'app1', registrationNumber: 'G1-0001' }),
  }
  const lookup = { listGrades: jest.fn().mockResolvedValue(grades) }
  return {
    repository,
    lookup,
    useCase: new RegisterApplicantUseCase(repository as never, lookup as never),
  }
}

const base = {
  fullName: 'Ahmad',
  email: 'ahmad@example.com',
  password: 'rahasia123',
  passwordConfirm: 'rahasia123',
}

describe('RegisterApplicantUseCase placement', () => {
  it('registers without the choices so an older web build keeps working', async () => {
    const { useCase, repository, lookup } = setup()

    await useCase.execute(base)

    expect(lookup.listGrades).not.toHaveBeenCalled()
    expect(repository.registerApplicant).toHaveBeenCalledWith(
      expect.not.objectContaining({ targetGradeId: expect.anything() }),
    )
  })

  it('stores the type, the grade and a copy of its level', async () => {
    const { useCase, repository, lookup } = setup([
      { id: 'g8', level: 8, name: 'Kelas 8' },
    ])

    await useCase.execute({
      ...base,
      admissionType: 'TRANSFER',
      targetGradeId: 'g8',
    })

    expect(lookup.listGrades).toHaveBeenCalledWith(['g8'])
    expect(repository.registerApplicant).toHaveBeenCalledWith(
      expect.objectContaining({
        admissionType: 'TRANSFER',
        targetGradeId: 'g8',
        targetGradeLevel: 8,
      }),
    )
  })

  it('refuses one choice without the other', async () => {
    const { useCase, repository } = setup()

    await expect(
      useCase.execute({ ...base, admissionType: 'NEW' }),
    ).rejects.toThrow(
      new BadRequestException(
        'Jenis pendaftaran dan tingkat kelas harus diisi bersama',
      ),
    )
    await expect(
      useCase.execute({ ...base, targetGradeId: 'g7' }),
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(repository.registerApplicant).not.toHaveBeenCalled()
  })

  it('refuses a grade that does not exist before any account is created', async () => {
    const { useCase, repository } = setup([])

    await expect(
      useCase.execute({
        ...base,
        admissionType: 'NEW',
        targetGradeId: 'gone',
      }),
    ).rejects.toThrow(new BadRequestException('Tingkat kelas tidak ditemukan'))
    expect(repository.registerApplicant).not.toHaveBeenCalled()
  })
})
