import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common'
import { ISalaryComponentRepository } from '../../component/domain/interfaces/salary-component-repository.interface.js'
import {
  SalaryAssignmentEntity,
  SalaryAssignmentWithComponent,
} from '../domain/entities/salary-assignment.entity.js'
import { ISalaryAssignmentRepository } from '../domain/interfaces/salary-assignment-repository.interface.js'
import { CreateSalaryAssignmentDto } from '../dto/request/create-salary-assignment.dto.js'

function dateOnly(value: string): Date {
  const parsed = new Date(value)
  return new Date(
    Date.UTC(
      parsed.getUTCFullYear(),
      parsed.getUTCMonth(),
      parsed.getUTCDate(),
    ),
  )
}

@Injectable()
export class GetSalaryAssignmentsUseCase {
  constructor(private readonly assignments: ISalaryAssignmentRepository) {}

  async execute(userId?: string): Promise<SalaryAssignmentWithComponent[]> {
    return this.assignments.findAll(userId)
  }
}

@Injectable()
export class CreateSalaryAssignmentUseCase {
  constructor(
    private readonly assignments: ISalaryAssignmentRepository,
    private readonly components: ISalaryComponentRepository,
  ) {}

  async execute(
    dto: CreateSalaryAssignmentDto,
    createdBy: string,
  ): Promise<SalaryAssignmentWithComponent> {
    const component = await this.components.findById(dto.componentId)
    if (!component?.isActive) {
      throw new NotFoundException('Salary component not found')
    }

    const isDriven = component.driver != null

    if (isDriven && !dto.rate) {
      throw new UnprocessableEntityException(
        `${component.name} is attendance-driven — supply a rate, not an amount.`,
      )
    }
    if (!isDriven && !dto.amount) {
      throw new UnprocessableEntityException(
        `${component.name} needs an amount.`,
      )
    }
    if (isDriven && dto.amount) {
      throw new UnprocessableEntityException(
        `${component.name} takes a rate, not an amount.`,
      )
    }
    if (!isDriven && dto.rate) {
      throw new UnprocessableEntityException(
        `${component.name} takes an amount, not a rate.`,
      )
    }

    return this.assignments.create({
      userId: dto.userId,
      componentId: dto.componentId,
      amount: dto.amount ?? null,
      rate: dto.rate ?? null,
      effectiveFrom: dateOnly(dto.effectiveFrom),
      createdBy,
    })
  }
}

@Injectable()
export class DeleteSalaryAssignmentUseCase {
  constructor(private readonly assignments: ISalaryAssignmentRepository) {}

  async execute(id: string): Promise<SalaryAssignmentEntity> {
    if (!(await this.assignments.findById(id))) {
      throw new NotFoundException('Salary assignment not found')
    }

    return this.assignments.softDelete(id)
  }
}
