import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { CreateStudentParentInput } from './create-student-parent.input.js'
import { IStudentParentRepository } from '../../../domain/repositories/student-parent.repository.js'
import { StudentParentWithDetails } from '../../../domain/repositories/student-parent.repository.js'
import {
  StudentNotFoundException,
  StudentParentAlreadyLinkedException,
} from '../../../domain/exceptions/index.js'

@Injectable()
export class CreateStudentParentUseCase {
  private readonly logger = new Logger(CreateStudentParentUseCase.name)

  constructor(
    private readonly studentParentRepository: IStudentParentRepository,
  ) {}

  async execute(
    input: CreateStudentParentInput,
  ): Promise<StudentParentWithDetails> {
    const [student, parent] = await Promise.all([
      this.studentParentRepository.findStudent(input.studentId),
      this.studentParentRepository.findParent(input.parentId),
    ])

    if (!student) throw new StudentNotFoundException(input.studentId)
    if (!parent)
      throw new NotFoundException(`Parent with ID ${input.parentId} not found`)

    const existing = await this.studentParentRepository.findPair(
      input.studentId,
      input.parentId,
    )
    if (existing) {
      throw new StudentParentAlreadyLinkedException()
    }

    const link = await this.studentParentRepository.create({
      studentId: input.studentId,
      parentId: input.parentId,
      relation: input.relation,
      isPrimary: input.isPrimary,
    })
    this.logger.log(
      `Student-parent link created (student: ${input.studentId}, parent: ${input.parentId})`,
    )
    return link
  }
}
