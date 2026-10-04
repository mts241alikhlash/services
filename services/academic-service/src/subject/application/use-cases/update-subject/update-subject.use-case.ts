import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { UpdateSubjectInput } from './update-subject.input.js'
import { ISubjectRepository } from '../../../domain/repositories/subject.repository.js'

@Injectable()
export class UpdateSubjectUseCase {
  private readonly logger = new Logger(UpdateSubjectUseCase.name)

  constructor(private readonly subjectRepository: ISubjectRepository) {}

  async execute(id: string, input: UpdateSubjectInput) {
    const existing = await this.subjectRepository.findById(id)
    if (!existing) {
      throw new NotFoundException(`Subject with ID ${id} not found`)
    }

    if (input.name) {
      const dup = await this.subjectRepository.findByName(input.name)
      if (dup && dup.id !== id) {
        throw new ConflictException(`Subject "${input.name}" already exists`)
      }
    }

    const updated = await this.subjectRepository.update(id, {
      code: input.code,
      name: input.name,
    })
    this.logger.log(`Subject updated: ${id}`)
    return updated
  }
}
