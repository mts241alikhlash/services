import { Injectable, NotFoundException } from '@nestjs/common'
import { IStudentRepository } from '../../../domain/repositories/student.repository.js'
import { StudentWithDetails } from '../../../domain/repositories/student.repository.js'
import { IProfileLookupPort } from '../../../../platform/profile-lookup/profile-lookup.port.js'

@Injectable()
export class GetMyStudentUseCase {
  constructor(
    private readonly studentRepository: IStudentRepository,
    private readonly profileLookup: IProfileLookupPort,
  ) {}

  async execute(userId: string): Promise<StudentWithDetails> {
    const own = await this.studentRepository.findByUserId(userId)
    if (!own) {
      throw new NotFoundException(
        'This account is not linked to a student record',
      )
    }

    const student = await this.studentRepository.findById(own.id)
    if (!student) {
      throw new NotFoundException(
        'This account is not linked to a student record',
      )
    }

    const [ownProfile] = await this.profileLookup.findByUserIds([userId])
    if (!ownProfile) return student

    return {
      ...student,
      user: {
        ...student.user,
        profile: {
          ...student.user.profile,
          birthPlace: ownProfile.birthPlace,
          birthDate: ownProfile.birthDate,
          email: ownProfile.email,
          phone: ownProfile.phone,
        },
      },
    }
  }
}
