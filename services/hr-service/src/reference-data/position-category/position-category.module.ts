import { Module } from '@nestjs/common'
import { PositionCategoryController } from './presentation/http/position-category.controller.js'
import { PrismaPositionCategoryRepository } from './infrastructure/persistence/prisma/prisma-position-category.repository.js'
import { IPositionCategoryRepository } from './domain/repositories/position-category.repository.js'
import { CreatePositionCategoryUseCase } from './application/use-cases/create-position-category/create-position-category.use-case.js'
import { GetPositionCategoriesUseCase } from './application/use-cases/get-position-categories/get-position-categories.use-case.js'
import { GetPositionCategoryByIdUseCase } from './application/use-cases/get-position-category-by-id/get-position-category-by-id.use-case.js'
import { UpdatePositionCategoryUseCase } from './application/use-cases/update-position-category/update-position-category.use-case.js'
import { DeletePositionCategoryUseCase } from './application/use-cases/delete-position-category/delete-position-category.use-case.js'

@Module({
  controllers: [PositionCategoryController],
  providers: [
    {
      provide: IPositionCategoryRepository,
      useClass: PrismaPositionCategoryRepository,
    },
    CreatePositionCategoryUseCase,
    GetPositionCategoriesUseCase,
    GetPositionCategoryByIdUseCase,
    UpdatePositionCategoryUseCase,
    DeletePositionCategoryUseCase,
  ],
  exports: [IPositionCategoryRepository],
})
export class PositionCategoryModule {}
