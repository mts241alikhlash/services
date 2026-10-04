import { Module } from '@nestjs/common'
import { CategoryController } from './presentation/http/category.controller.js'
import { PrismaCategoryRepository } from './infrastructure/persistence/prisma/prisma-category.repository.js'
import { ICategoryRepository } from './domain/repositories/category.repository.js'
import { CreateCategoryUseCase } from './application/use-cases/create-category/create-category.use-case.js'
import { DeleteCategoryUseCase } from './application/use-cases/delete-category/delete-category.use-case.js'
import { GetCategoriesUseCase } from './application/use-cases/get-categories/get-categories.use-case.js'
import { UpdateCategoryUseCase } from './application/use-cases/update-category/update-category.use-case.js'

@Module({
  controllers: [CategoryController],
  providers: [
    { provide: ICategoryRepository, useClass: PrismaCategoryRepository },
    GetCategoriesUseCase,
    CreateCategoryUseCase,
    UpdateCategoryUseCase,
    DeleteCategoryUseCase,
  ],
  exports: [ICategoryRepository],
})
export class CategoryModule {}
