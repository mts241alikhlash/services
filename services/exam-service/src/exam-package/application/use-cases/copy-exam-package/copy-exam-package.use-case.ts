import { Injectable, NotFoundException } from '@nestjs/common'
import type { ExamPackageDetail } from '../../../domain/entities/exam-package.entity.js'
import { IExamPackageRepository } from '../../../domain/repositories/exam-package.repository.js'
import { MAX_TITLE_LENGTH } from '../../build-package-items.js'

@Injectable()
export class CopyExamPackageUseCase {
  constructor(private readonly packages: IExamPackageRepository) {}

  async execute(user: { id: string }, id: string): Promise<ExamPackageDetail> {
    const source = await this.packages.findById(id)
    if (source === null) throw new NotFoundException('Paket tidak ditemukan')

    return this.packages.create({
      title: `Salinan ${source.title}`.slice(0, MAX_TITLE_LENGTH),
      subjectId: source.subjectId,
      gradeId: source.gradeId,
      createdById: user.id,
      items: source.items,
    })
  }
}
