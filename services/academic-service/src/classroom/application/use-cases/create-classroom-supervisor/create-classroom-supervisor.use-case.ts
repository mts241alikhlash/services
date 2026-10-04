import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { IClassroomSupervisorRepository } from '../../../domain/repositories/classroom-supervisor.repository.js'
import type { CreateClassroomSupervisorInput } from './create-classroom-supervisor.input.js'

@Injectable()
export class CreateClassroomSupervisorUseCase {
  private readonly logger = new Logger(CreateClassroomSupervisorUseCase.name)

  constructor(
    private readonly classroomSupervisorRepository: IClassroomSupervisorRepository,
  ) {}

  async execute(input: CreateClassroomSupervisorInput) {
    const [employee, existing] = await Promise.all([
      this.classroomSupervisorRepository.findEmployeeById(input.employeeId),
      this.classroomSupervisorRepository.findAssignment(
        input.classroomId,
        input.semesterId,
      ),
    ])

    if (!employee)
      throw new NotFoundException(
        `Employee with ID ${input.employeeId} not found`,
      )
    if (existing)
      throw new ConflictException(
        'This classroom already has a supervisor assigned for this semester',
      )

    const supervisor = await this.classroomSupervisorRepository.create({
      classroomId: input.classroomId,
      employeeId: input.employeeId,
      semesterId: input.semesterId,
    })

    this.logger.log(
      `ClassroomSupervisor created: Classroom ${input.classroomId}, Employee ${input.employeeId}, Semester ${input.semesterId}`,
    )
    return supervisor
  }
}
