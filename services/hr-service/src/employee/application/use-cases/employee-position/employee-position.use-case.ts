import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import {
  CreateEmployeePositionInput,
  UpdateEmployeePositionInput,
} from './employee-position.input.js'
import { IEmployeePositionRepository } from '../../../domain/repositories/employee-position.repository.js'
import { IEmployeeRepository } from '../../../domain/repositories/employee.repository.js'

@Injectable()
export class EmployeePositionUseCase {
  private readonly logger = new Logger(EmployeePositionUseCase.name)

  constructor(
    private readonly employeeRepository: IEmployeeRepository,
    private readonly employeePositionRepository: IEmployeePositionRepository,
  ) {}

  async findAll(employeeId: string) {
    await this.ensureEmployeeExists(employeeId)
    return this.employeePositionRepository.findByEmployeeId(employeeId)
  }

  async assign(employeeId: string, input: CreateEmployeePositionInput) {
    await this.ensureEmployeeExists(employeeId)

    const position = await this.employeePositionRepository.findPositionById(
      input.positionId,
    )
    if (!position) {
      throw new NotFoundException(
        `Position with ID ${input.positionId} not found`,
      )
    }
    if (!position.isActive) {
      throw new BadRequestException(
        `Position "${position.name}" is no longer active and cannot be assigned`,
      )
    }

    const existing =
      await this.employeePositionRepository.findByEmployeeAndPosition(
        employeeId,
        input.positionId,
      )
    if (existing) {
      throw new ConflictException(
        'This position is already assigned to the employee',
      )
    }

    const link = await this.employeePositionRepository.create(employeeId, {
      ...input,
      hireDate: new Date(input.hireDate),
    })
    this.logger.log(
      `Position ${input.positionId} assigned to employee ${employeeId}`,
    )
    return link
  }

  async update(
    employeeId: string,
    linkId: string,
    input: UpdateEmployeePositionInput,
  ) {
    await this.ensureEmployeeExists(employeeId)
    await this.ensureLinkExists(employeeId, linkId)
    const { hireDate, ...rest } = input
    const updated = await this.employeePositionRepository.update(
      employeeId,
      linkId,
      {
        ...rest,
        ...(hireDate !== undefined && { hireDate: new Date(hireDate) }),
      },
    )
    this.logger.log(
      `Position link ${linkId} updated for employee ${employeeId}`,
    )
    return updated
  }

  async remove(employeeId: string, linkId: string): Promise<void> {
    await this.ensureEmployeeExists(employeeId)
    await this.ensureLinkExists(employeeId, linkId)
    await this.employeePositionRepository.softDelete(employeeId, linkId)
    this.logger.log(
      `Position link ${linkId} removed from employee ${employeeId}`,
    )
  }

  private async ensureEmployeeExists(id: string) {
    const employee = await this.employeeRepository.findById(id)
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`)
    }
    return employee
  }

  private async ensureLinkExists(employeeId: string, linkId: string) {
    const link = await this.employeePositionRepository.findById(
      employeeId,
      linkId,
    )
    if (!link) {
      throw new NotFoundException(
        `Position assignment with ID ${linkId} not found for this employee`,
      )
    }
    return link
  }
}
