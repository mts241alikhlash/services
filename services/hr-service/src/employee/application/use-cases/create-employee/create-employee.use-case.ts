import { ConflictException, Injectable, Logger } from '@nestjs/common'
import { CreateEmployeeInput } from './create-employee.input.js'
import { IEmployeeRepository } from '../../../domain/repositories/employee.repository.js'
import { hashPassword } from '../../../../shared/utils/hash.helper.js'

@Injectable()
export class CreateEmployeeUseCase {
  private readonly logger = new Logger(CreateEmployeeUseCase.name)

  constructor(private readonly employeeRepository: IEmployeeRepository) {}

  async execute(input: CreateEmployeeInput) {
    const fallback = input.nip ?? input.nuptk ?? input.nik
    input.identifier ??= fallback
    input.password ??= fallback

    const [existingUsername, existingNik, existingNip, existingNuptk] =
      await Promise.all([
        this.employeeRepository.findUserByIdentifier(input.identifier),
        this.employeeRepository.findProfileByNik(input.nik),
        input.nip ? this.employeeRepository.findByNip(input.nip) : null,
        input.nuptk ? this.employeeRepository.findByNuptk(input.nuptk) : null,
      ])

    if (existingUsername) {
      throw new ConflictException(
        `Identifier "${input.identifier}" is already taken`,
      )
    }
    if (existingNik) {
      throw new ConflictException(`NIK "${input.nik}" is already registered`)
    }
    if (existingNip) {
      throw new ConflictException(`NIP "${input.nip}" is already registered`)
    }
    if (existingNuptk) {
      throw new ConflictException(
        `NUPTK "${input.nuptk}" is already registered`,
      )
    }

    const hashedPassword = await hashPassword(input.password)
    const employee = await this.employeeRepository.create(
      { ...input, birthDate: new Date(input.birthDate) },
      hashedPassword,
    )

    this.logger.log(`Employee created: ${input.name}`)
    return employee
  }
}
