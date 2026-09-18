import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { IClassroomSupervisorRepository } from '../../../domain/repositories/classroom-supervisor.repository.js'
import type { UpdateClassroomSupervisorInput } from './update-classroom-supervisor.input.js'

@Injectable()
export class UpdateClassroomSupervisorUseCase {
  private readonly logger = new Logger(UpdateClassroomSupervisorUseCase.name)

  constructor(
    private readonly classroomSupervisorRepository: IClassroomSupervisorRepository,
  ) {}

  async execute(id: string, input: UpdateClassroomSupervisorInput) {
    const existing = await this.classroomSupervisorRepository.findById(id)
    if (!existing)
      throw new NotFoundException(`ClassroomSupervisor with ID ${id} not found`)

    if (input.employeeId && input.employeeId !== existing.employeeId) {
      const employee =
        await this.classroomSupervisorRepository.findEmployeeById(
          input.employeeId,
        )
      if (!employee)
        throw new NotFoundException(
          `Employee with ID ${input.employeeId} not found`,
        )
    }

    const newClassroomId = input.classroomId ?? existing.classroomId
    const newSemesterId = input.semesterId ?? existing.semesterId

    if (
      newClassroomId !== existing.classroomId ||
      newSemesterId !== existing.semesterId
    ) {
      const dup = await this.classroomSupervisorRepository.findAssignment(
        newClassroomId,
        newSemesterId,
        id,
      )
      if (dup)
        throw new ConflictException(
          'This classroom already has a supervisor assigned for this semester',
        )
    }

    const updated = await this.classroomSupervisorRepository.update(id, {
      classroomId: input.classroomId,
      employeeId: input.employeeId,
      semesterId: input.semesterId,
    })
    this.logger.log(`ClassroomSupervisor updated: ${id}`)
    return updated
  }
}
