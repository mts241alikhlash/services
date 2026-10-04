import type { ProfileUpdateInput } from '../../../../platform/profile/domain/entities/profile.entity.js'
import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { UpdateEmployeeProfileInput } from './update-employee-profile.input.js'
import { IEmployeeRepository } from '../../../domain/repositories/employee.repository.js'

@Injectable()
export class UpdateEmployeeProfileUseCase {
  private readonly logger = new Logger(UpdateEmployeeProfileUseCase.name)

  constructor(private readonly employeeRepository: IEmployeeRepository) {}

  async execute(id: string, input: UpdateEmployeeProfileInput) {
    const employee = await this.employeeRepository.findById(id)
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`)
    }

    if (input.nik) {
      const duplicate = await this.employeeRepository.findProfileByUserId(
        employee.user.id,
        input.nik,
      )
      if (duplicate) {
        throw new ConflictException(`NIK "${input.nik}" is already registered`)
      }
    }

    const { birthDate, ...rest } = input
    const profileInput: ProfileUpdateInput = {
      ...rest,
      ...(birthDate && { birthDate: new Date(birthDate) }),
    }

    const profile = await this.employeeRepository.updateProfile(
      employee.user.id,
      profileInput,
    )
    this.logger.log(`Employee profile updated: ${id}`)
    return profile
  }
}
