import { Injectable, NotFoundException } from '@nestjs/common'
import { IStudentRepository } from '../../../domain/repositories/student.repository.js'
import { StudentWithDetails } from '../../../domain/repositories/student.repository.js'

@Injectable()
export class GetMyStudentUseCase {
  constructor(private readonly studentRepository: IStudentRepository) {}

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

    return student
  }
}
