import { Injectable, Logger } from '@nestjs/common'
import { UpdateStudentParentInput } from './update-student-parent.input.js'
import { IStudentParentRepository } from '../../../domain/repositories/student-parent.repository.js'
import { StudentParentWithDetails } from '../../../domain/repositories/student-parent.repository.js'
import { StudentParentLinkNotFoundException } from '../../../domain/exceptions/index.js'

@Injectable()
export class UpdateStudentParentUseCase {
  private readonly logger = new Logger(UpdateStudentParentUseCase.name)

  constructor(
    private readonly studentParentRepository: IStudentParentRepository,
  ) {}

  async execute(
    id: string,
    input: UpdateStudentParentInput,
  ): Promise<StudentParentWithDetails> {
    const current = await this.studentParentRepository.findById(id)
    if (!current) throw new StudentParentLinkNotFoundException(id)

    const updated = await this.studentParentRepository.update(
      id,
      input,
      current.studentId,
    )
    this.logger.log(`Student-parent link updated: ${id}`)
    return updated
  }
}
