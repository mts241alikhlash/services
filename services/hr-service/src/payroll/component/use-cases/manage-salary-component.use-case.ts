import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common'
import { SalaryComponentEntity } from '../domain/entities/salary-component.entity.js'
import { ISalaryComponentRepository } from '../domain/interfaces/salary-component-repository.interface.js'
import { CreateSalaryComponentDto } from '../dto/request/create-salary-component.dto.js'
import { UpdateSalaryComponentDto } from '../dto/request/update-salary-component.dto.js'

const DRIVEN_TYPE = 'ATTENDANCE_DRIVEN'
const DRIVABLE_TYPES = [DRIVEN_TYPE, 'DEDUCTION']

function assertDriverCoherent(
  type: string | undefined,
  driver: string | null | undefined,
): void {
  if (type === DRIVEN_TYPE && !driver) {
    throw new UnprocessableEntityException(
      'An attendance-driven component needs a driver.',
    )
  }
  if (type && !DRIVABLE_TYPES.includes(type) && driver) {
    throw new UnprocessableEntityException(
      'Only an attendance-driven component or a deduction may have a driver.',
    )
  }
}

@Injectable()
export class GetSalaryComponentsUseCase {
  constructor(private readonly repository: ISalaryComponentRepository) {}

  async execute(includeInactive = false): Promise<SalaryComponentEntity[]> {
    return this.repository.findAll(includeInactive)
  }
}

@Injectable()
export class CreateSalaryComponentUseCase {
  constructor(private readonly repository: ISalaryComponentRepository) {}

  async execute(dto: CreateSalaryComponentDto): Promise<SalaryComponentEntity> {
    assertDriverCoherent(dto.type, dto.driver)

    if (await this.repository.findByCode(dto.code)) {
      throw new ConflictException(`Code "${dto.code}" is already in use.`)
    }

    return this.repository.create({
      code: dto.code,
      name: dto.name,
      type: dto.type,
      driver: dto.driver ?? null,
    })
  }
}

@Injectable()
export class UpdateSalaryComponentUseCase {
  constructor(private readonly repository: ISalaryComponentRepository) {}

  async execute(
    id: string,
    dto: UpdateSalaryComponentDto,
  ): Promise<SalaryComponentEntity> {
    const existing = await this.repository.findById(id)
    if (!existing) {
      throw new NotFoundException('Salary component not found')
    }

    assertDriverCoherent(
      dto.type ?? existing.type,
      dto.driver ?? existing.driver,
    )

    return this.repository.update(id, dto)
  }
}

@Injectable()
export class DeleteSalaryComponentUseCase {
  constructor(private readonly repository: ISalaryComponentRepository) {}

  async execute(id: string): Promise<SalaryComponentEntity> {
    if (!(await this.repository.findById(id))) {
      throw new NotFoundException('Salary component not found')
    }

    const assigned = await this.repository.countAssignments(id)
    if (assigned > 0) {
      throw new ConflictException(
        `${assigned} employee assignment(s) still use this component. Deactivate it instead.`,
      )
    }

    return this.repository.softDelete(id)
  }
}
