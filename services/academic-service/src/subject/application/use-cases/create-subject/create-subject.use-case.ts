import { ConflictException, Injectable, Logger } from '@nestjs/common'
import { CreateSubjectInput } from './create-subject.input.js'
import { ISubjectRepository } from '../../../domain/repositories/subject.repository.js'

@Injectable()
export class CreateSubjectUseCase {
  private readonly logger = new Logger(CreateSubjectUseCase.name)

  constructor(private readonly subjectRepository: ISubjectRepository) {}

  async execute(input: CreateSubjectInput) {
    const existing = await this.subjectRepository.findByName(input.name)
    if (existing) {
      throw new ConflictException(`Subject "${input.name}" already exists`)
    }

    const subject = await this.subjectRepository.create({
      code: input.code,
      name: input.name,
    })
    this.logger.log(`Subject created: ${input.name}`)
    return subject
  }
}
