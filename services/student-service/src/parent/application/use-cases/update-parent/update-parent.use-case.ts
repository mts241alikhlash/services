import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { ParentWithDetails } from '../../../domain/entities/parent.entity.js'
import { IParentRepository } from '../../../domain/repositories/parent.repository.js'
import type { UpdateParentInput } from './update-parent.input.js'

@Injectable()
export class UpdateParentUseCase {
  private readonly logger = new Logger(UpdateParentUseCase.name)

  constructor(private readonly parentRepository: IParentRepository) {}

  async execute(
    id: string,
    input: UpdateParentInput,
  ): Promise<ParentWithDetails> {
    const existing = await this.parentRepository.findById(id)
    if (!existing) {
      throw new NotFoundException(`Parent with ID ${id} not found`)
    }

    if (input.nik) {
      const dupNik = await this.parentRepository.findByNik(input.nik, id)
      if (dupNik) {
        throw new ConflictException(`NIK "${input.nik}" is already registered`)
      }
    }

    if (input.occupationId) {
      const occupation = await this.parentRepository.findOccupationById(
        input.occupationId,
      )
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
    }

    const { birthDate, ...rest } = input
    const parent = await this.parentRepository.update(id, {
      ...rest,
      ...(birthDate !== undefined && {
        birthDate: birthDate instanceof Date ? birthDate : new Date(birthDate),
      }),
    })
    this.logger.log(`Parent updated: ${id}`)
    return parent
  }
}
