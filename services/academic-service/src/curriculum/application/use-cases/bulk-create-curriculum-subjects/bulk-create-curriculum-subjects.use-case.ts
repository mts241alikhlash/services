import { Injectable } from '@nestjs/common'
import { ICurriculumSubjectRepository } from '../../../domain/repositories/curriculum-subject.repository.js'
import type { BulkCreateCurriculumSubjectsInput } from './bulk-create-curriculum-subjects.input.js'

export interface BulkCreateResult {
  created: number
  skipped: number
}

@Injectable()
export class BulkCreateCurriculumSubjectsUseCase {
  constructor(
    private readonly curriculumSubjectRepository: ICurriculumSubjectRepository,
  ) {}

  async execute(
    input: BulkCreateCurriculumSubjectsInput,
  ): Promise<BulkCreateResult> {
    let created = 0
    let skipped = 0

    for (const item of input.items) {
      const existing = await this.curriculumSubjectRepository.findDuplicate(
        item.curriculumId,
        item.subjectId,
      )
      if (existing) {
        skipped++
        continue
      }

      const softDeleted =
        await this.curriculumSubjectRepository.findSoftDeleted(
          item.curriculumId,
          item.subjectId,
        )
      if (softDeleted) {
        await this.curriculumSubjectRepository.restore(softDeleted.id, {
          hoursPerWeek: item.hoursPerWeek,
          passingScore: item.passingScore,
        })
      } else {
        await this.curriculumSubjectRepository.create({
          curriculumId: item.curriculumId,
          subjectId: item.subjectId,
          hoursPerWeek: item.hoursPerWeek,
          passingScore: item.passingScore,
        })
      }
      created++
    }

    return { created, skipped }
  }
}
