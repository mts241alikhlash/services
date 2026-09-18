import { Injectable, NotFoundException } from '@nestjs/common'
import { ICategoryRepository } from '../../../domain/repositories/category.repository.js'
import { UpdateCategoryInput } from './update-category.input.js'

@Injectable()
export class UpdateCategoryUseCase {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  async execute(id: string, input: UpdateCategoryInput) {
    const category = await this.categoryRepository.findById(id)
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`)
    }
    return this.categoryRepository.update(id, {
      code: input.code,
      name: input.name,
      depreciationRatePercent: input.depreciationRatePercent,
    })
  }
}
