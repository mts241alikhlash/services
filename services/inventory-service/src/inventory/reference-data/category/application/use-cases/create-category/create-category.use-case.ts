import { Injectable } from '@nestjs/common'
import { ICategoryRepository } from '../../../domain/repositories/category.repository.js'
import { CreateCategoryInput } from './create-category.input.js'

@Injectable()
export class CreateCategoryUseCase {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  async execute(input: CreateCategoryInput) {
    return this.categoryRepository.create({
      code: input.code,
      name: input.name,
      depreciationRatePercent: input.depreciationRatePercent,
    })
  }
}
