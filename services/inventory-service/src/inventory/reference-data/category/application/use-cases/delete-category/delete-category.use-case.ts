import { Injectable, NotFoundException } from '@nestjs/common'
import { ICategoryRepository } from '../../../domain/repositories/category.repository.js'

@Injectable()
export class DeleteCategoryUseCase {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  async execute(id: string) {
    const category = await this.categoryRepository.findById(id)
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`)
    }
    return this.categoryRepository.delete(id)
  }
}
