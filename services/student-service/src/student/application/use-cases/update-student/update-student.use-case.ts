import { Injectable, Logger } from '@nestjs/common'
import { UpdateStudentInput } from './update-student.input.js'
import { IStudentRepository } from '../../../domain/repositories/student.repository.js'
import { StudentWithDetails } from '../../../domain/repositories/student.repository.js'
import {
  StudentNisAlreadyExistsException,
  StudentNisnAlreadyExistsException,
  StudentNotFoundException,
} from '../../../domain/exceptions/index.js'

@Injectable()
export class UpdateStudentUseCase {
  private readonly logger = new Logger(UpdateStudentUseCase.name)

  constructor(private readonly studentRepository: IStudentRepository) {}

  async execute(
    id: string,
    input: UpdateStudentInput,
  ): Promise<StudentWithDetails> {
    const student = await this.studentRepository.findById(id)
    if (!student) throw new StudentNotFoundException(id)

    if (input.nis) {
      const dup = await this.studentRepository.findByNis(input.nis)
      if (dup && dup.id !== id)
        throw new StudentNisAlreadyExistsException(input.nis)
    }
    if (input.nisn) {
      const dup = await this.studentRepository.findByNisn(input.nisn)
      if (dup && dup.id !== id)
        throw new StudentNisnAlreadyExistsException(input.nisn)
    }

    const updated = await this.studentRepository.update(id, {
      nis: input.nis,
      nisn: input.nisn,
      gradeId: input.gradeId,
      status: input.status,
    })
    this.logger.log(`Student updated: ${id}`)
    return updated
  }
}
