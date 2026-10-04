import { Module } from '@nestjs/common'
import { SemesterPromotionController } from './presentation/http/semester-promotion.controller.js'
import { PrismaPromotionRepository } from './infrastructure/persistence/prisma/prisma-promotion.repository.js'
import { GeneratePromotionRecommendationUseCase } from './application/use-cases/generate-promotion-recommendation/generate-promotion-recommendation.use-case.js'
import { PreviewPromotionUseCase } from './application/use-cases/preview-promotion/preview-promotion.use-case.js'
import { PromoteStudentsUseCase } from './application/use-cases/promote-students/promote-students.use-case.js'
import { PromotionSemesterResolver } from './application/services/promotion-semester-resolver.service.js'
import { IPromotionRepository } from './domain/repositories/promotion.repository.js'

@Module({
  controllers: [SemesterPromotionController],
  providers: [
    { provide: IPromotionRepository, useClass: PrismaPromotionRepository },
    PromotionSemesterResolver,
    PreviewPromotionUseCase,
    PromoteStudentsUseCase,
    GeneratePromotionRecommendationUseCase,
  ],
  exports: [IPromotionRepository],
})
export class SemesterPromotionModule {}
