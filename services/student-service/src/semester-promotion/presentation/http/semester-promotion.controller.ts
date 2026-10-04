import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { RequirePermissions } from '../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { JwtAuthGuard } from '../../../platform/auth/index.js'
import { GenerateRecommendationDto } from './dto/request/generate-recommendation.dto.js'
import { PromotionRecommendationDto } from './dto/response/promotion-recommendation.dto.js'
import { PromotionDto } from './dto/request/promotion.dto.js'
import { PromotionPreviewDto } from './dto/response/promotion-preview.dto.js'
import { PromotionResultDto } from './dto/response/promotion-result.dto.js'
import { GeneratePromotionRecommendationUseCase } from '../../application/use-cases/generate-promotion-recommendation/generate-promotion-recommendation.use-case.js'
import { PreviewPromotionUseCase } from '../../application/use-cases/preview-promotion/preview-promotion.use-case.js'
import { PromoteStudentsUseCase } from '../../application/use-cases/promote-students/promote-students.use-case.js'

@ApiTags('Semesters')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('student-promotions')
export class SemesterPromotionController {
  constructor(
    private readonly promoteStudentsService: PromoteStudentsUseCase,
    private readonly previewPromotionService: PreviewPromotionUseCase,
    private readonly generateRecommendationService: GeneratePromotionRecommendationUseCase,
  ) {}

  @Post('recommend')
  @RequirePermissions('semesters.create')
  @ApiOperation({
    summary:
      'Generate per-student promotion recommendations based on class level',
  })
  @ApiResponse({
    status: 200,
    description: 'List of students with recommended promotion actions',
    type: PromotionRecommendationDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Semester not found' })
  async recommend(
    @Body() dto: GenerateRecommendationDto,
  ): Promise<PromotionRecommendationDto> {
    const result = await this.generateRecommendationService.execute({
      sourceAcademicYearId: dto.sourceAcademicYearId,
      targetAcademicYearId: dto.targetAcademicYearId,
    })
    return PromotionRecommendationDto.fromResult(result)
  }

  @Post('preview')
  @RequirePermissions('semesters.create')
  @ApiOperation({
    summary: 'Preview promotion summary counts from per-student decisions',
  })
  @ApiResponse({
    status: 200,
    description: 'Promotion preview with student counts per action',
    type: PromotionPreviewDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Semester not found' })
  previewPromotion(@Body() dto: PromotionDto): PromotionPreviewDto {
    const result = this.previewPromotionService.execute({
      sourceAcademicYearId: dto.sourceAcademicYearId,
      targetAcademicYearId: dto.targetAcademicYearId,
      students: dto.students,
    })
    return PromotionPreviewDto.fromResult(result)
  }

  @Post()
  @RequirePermissions('semesters.create')
  @ApiOperation({
    summary:
      'Execute batch student promotion across academic years (PROMOTE/REPEAT)',
  })
  @ApiResponse({
    status: 200,
    description: 'Promotion result with counts',
    type: PromotionResultDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Semester or class not found' })
  async promote(@Body() dto: PromotionDto): Promise<PromotionResultDto> {
    const result = await this.promoteStudentsService.execute({
      sourceAcademicYearId: dto.sourceAcademicYearId,
      targetAcademicYearId: dto.targetAcademicYearId,
      students: dto.students,
    })
    return PromotionResultDto.fromResult(result)
  }
}
