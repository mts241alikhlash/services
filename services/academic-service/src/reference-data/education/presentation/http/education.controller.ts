import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../../platform/auth/index.js'
import { RequirePermissions } from '../../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { GetEducationsUseCase } from '../../application/use-cases/get-educations/get-educations.use-case.js'
import { EducationQueryDto } from './dto/request/education-query.dto.js'
import { EducationListResponseDto } from './dto/response/education-response.dto.js'

@ApiTags('Educations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('educations')
export class EducationController {
  constructor(private readonly getEducations: GetEducationsUseCase) {}

  @Get()
  @RequirePermissions('educations.read')
  @ApiOperation({ summary: 'List education levels (paginated, filterable)' })
  @ApiResponse({ status: 200, type: EducationListResponseDto })
  async findAll(@Query() query: EducationQueryDto) {
    return this.getEducations.execute({
      page: query.page,
      limit: query.limit,
      search: query.search,
      isActive: query.isActive,
    })
  }
}
