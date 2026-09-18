import { ForbiddenException, Injectable } from '@nestjs/common'
import { IStudentRepository } from '../../../domain/repositories/student.repository.js'
import type { RequestUser } from '../../../../core/types/request-user.type.js'
import { StudentWithDetails } from '../../../domain/repositories/student.repository.js'
import { StudentNotFoundException } from '../../../domain/exceptions/index.js'

@Injectable()
export class GetStudentByIdUseCase {
  constructor(private readonly studentRepository: IStudentRepository) {}

  async execute(
    id: string,
    requester?: RequestUser,
  ): Promise<StudentWithDetails> {
    if (requester) {
      const isStudent = requester.roles?.includes('STUDENT') ?? false
      if (isStudent) {
        const own = await this.studentRepository.findByUserId(requester.id)
        if (!own)
          throw new ForbiddenException(
            'Student account is not linked to an active student record',
          )
        if (own.id !== id)
          throw new ForbiddenException(
            'You can only access your own student data',
          )
      }
    }

    const student = await this.studentRepository.findById(id)
    if (!student) throw new StudentNotFoundException(id)
    return student
  }
}
