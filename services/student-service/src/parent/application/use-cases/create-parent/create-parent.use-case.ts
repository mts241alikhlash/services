import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { ParentWithDetails } from '../../../domain/entities/parent.entity.js'
import { IParentRepository } from '../../../domain/repositories/parent.repository.js'
import type { CreateParentInput } from './create-parent.input.js'

@Injectable()
export class CreateParentUseCase {
  private readonly logger = new Logger(CreateParentUseCase.name)

  constructor(private readonly parentRepository: IParentRepository) {}

  async execute(input: CreateParentInput): Promise<ParentWithDetails> {
    const [existingNik, occupation] = await Promise.all([
      this.parentRepository.findByNik(input.nik),
      this.parentRepository.findOccupationById(input.occupationId),
    ])

    if (existingNik) {
      throw new ConflictException(`NIK "${input.nik}" is already registered`)
    }

    if (!occupation) {
      throw new NotFoundException(
        `Occupation with ID ${input.occupationId} not found`,
      )
    }

    if (!occupation.isActive) {
      throw new ConflictException(
        `Occupation "${occupation.name}" is inactive and cannot be assigned`,
      )
    }

    const parent = await this.parentRepository.create({
      ...input,
      birthDate:
        input.birthDate instanceof Date
          ? input.birthDate
          : new Date(input.birthDate),
    })
    this.logger.log(`Parent created: ${parent.name}`)
    return parent
  }
}
