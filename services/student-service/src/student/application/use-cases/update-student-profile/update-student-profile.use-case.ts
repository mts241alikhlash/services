import { Injectable, Logger } from '@nestjs/common'
import { UpdateStudentProfileInput } from './update-student-profile.input.js'
import { IStudentRepository } from '../../../domain/repositories/student.repository.js'
import { StudentNotFoundException } from '../../../domain/exceptions/index.js'

@Injectable()
export class UpdateStudentProfileUseCase {
  private readonly logger = new Logger(UpdateStudentProfileUseCase.name)

  constructor(private readonly studentRepository: IStudentRepository) {}

  async execute(id: string, input: UpdateStudentProfileInput) {
    const student = await this.studentRepository.findById(id)
    if (!student) throw new StudentNotFoundException(id)

    const { birthDate, ...rest } = input
    const updated = await this.studentRepository.updateProfile(id, {
      ...rest,
      ...(birthDate !== undefined && { birthDate: new Date(birthDate) }),
    })
    this.logger.log(`Student profile updated: ${id}`)
    return updated
  }
}
