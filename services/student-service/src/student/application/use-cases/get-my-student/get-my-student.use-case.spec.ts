import { NotFoundException } from '@nestjs/common'
import { GetMyStudentUseCase } from './get-my-student.use-case.js'
import { IStudentRepository } from '../../../domain/repositories/student.repository.js'
import {
  IProfileLookupPort,
  ProfileSummary,
} from '../../../../platform/profile-lookup/profile-lookup.port.js'

describe('GetMyStudentUseCase', () => {
  function makeUseCase(options: {
    own?: { id: string } | null
    record?: unknown
    profiles?: Partial<ProfileSummary>[]
  }) {
    const findByUserId = jest.fn().mockResolvedValue(options.own ?? null)
    const findById = jest.fn().mockResolvedValue(options.record ?? null)

    const findByUserIds = jest.fn().mockResolvedValue(options.profiles ?? [])

    const useCase = new GetMyStudentUseCase(
      { findByUserId, findById } as unknown as IStudentRepository,
      { findByUserIds } as unknown as IProfileLookupPort,
    )

    return { useCase, findByUserId, findById, findByUserIds }
  }

  it('answers with the record belonging to the caller', async () => {
    const { useCase, findByUserId, findById } = makeUseCase({
      own: { id: 'student-1' },
      record: { id: 'student-1', nis: '2460013' },
    })

    const result = await useCase.execute('user-1')

    expect(findByUserId).toHaveBeenCalledWith('user-1')
    expect(findById).toHaveBeenCalledWith('student-1')
    expect(result).toEqual({ id: 'student-1', nis: '2460013' })
  })

  it('refuses an account with no student record', async () => {
    const { useCase, findById } = makeUseCase({ own: null })

    await expect(useCase.execute('user-1')).rejects.toBeInstanceOf(
      NotFoundException,
    )
    expect(findById).not.toHaveBeenCalled()
  })

  it('refuses when the linked record has since gone', async () => {
    const { useCase } = makeUseCase({ own: { id: 'student-1' }, record: null })

    await expect(useCase.execute('user-1')).rejects.toBeInstanceOf(
      NotFoundException,
    )
  })

  it('adds the birth data and contacts of the caller to the profile', async () => {
    const { useCase, findByUserIds } = makeUseCase({
      own: { id: 'student-1' },
      record: {
        id: 'student-1',
        user: {
          id: 'user-1',
          identifier: '2460013',
          isActive: true,
          profile: { name: 'Ahmad Fauzi', nik: '3201', gender: 'MALE' },
        },
      },
      profiles: [
        {
          userId: 'user-1',
          birthPlace: 'Bandung',
          birthDate: '2013-05-17T00:00:00.000Z',
          email: 'ahmad@example.com',
          phone: '081234567890',
        },
      ],
    })

    const result = await useCase.execute('user-1')

    expect(findByUserIds).toHaveBeenCalledWith(['user-1'])
    expect(result.user.profile).toEqual({
      name: 'Ahmad Fauzi',
      nik: '3201',
      gender: 'MALE',
      birthPlace: 'Bandung',
      birthDate: '2013-05-17T00:00:00.000Z',
      email: 'ahmad@example.com',
      phone: '081234567890',
    })
  })

  it('leaves the profile as it is when the identity lookup has no entry', async () => {
    const { useCase } = makeUseCase({
      own: { id: 'student-1' },
      record: {
        id: 'student-1',
        user: {
          id: 'user-1',
          identifier: '2460013',
          isActive: true,
          profile: { name: 'Ahmad Fauzi', nik: '3201', gender: 'MALE' },
        },
      },
    })

    const result = await useCase.execute('user-1')

    expect(result.user.profile).toEqual({
      name: 'Ahmad Fauzi',
      nik: '3201',
      gender: 'MALE',
    })
  })
})
