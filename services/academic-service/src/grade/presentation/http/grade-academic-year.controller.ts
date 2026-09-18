import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../platform/auth/index.js'
import { RequirePermissions } from '../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { AssignCurriculumToGradeDto } from './dto/request/assign-curriculum-to-grade.dto.js'
import { AssignCurriculumToGradeUseCase } from '../../application/use-cases/assign-curriculum-to-grade/assign-curriculum-to-grade.use-case.js'
import { GetGradeAcademicYearsUseCase } from '../../application/use-cases/get-grade-academic-years/get-grade-academic-years.use-case.js'
import { RemoveCurriculumFromGradeUseCase } from '../../application/use-cases/remove-curriculum-from-grade/remove-curriculum-from-grade.use-case.js'

@ApiTags('Grade Academic Years')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('grade-academic-years')
export class GradeAcademicYearController {
  constructor(
    private readonly assignService: AssignCurriculumToGradeUseCase,
    private readonly getService: GetGradeAcademicYearsUseCase,
    private readonly removeService: RemoveCurriculumFromGradeUseCase,
  ) {}

  @Get()
  @RequirePermissions('curricula.read')
  @ApiOperation({ summary: 'List grade-curriculum assignments' })
  @ApiQuery({ name: 'academicYearId', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'List of grade academic year assignments',
  })
  async findAll(@Query('academicYearId') academicYearId?: string) {
    return this.getService.execute(academicYearId)
  }

  @Post()
  @RequirePermissions('curricula.update')
  @ApiOperation({
    summary: 'Assign curriculum to grade for academic year (upsert)',
  })
  @ApiResponse({ status: 201, description: 'Assignment created or updated' })
  async assign(@Body() dto: AssignCurriculumToGradeDto) {
    return this.assignService.execute(dto)
  }

  @Delete(':id')
  @RequirePermissions('curricula.update')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove grade-curriculum assignment' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.removeService.execute(id)
  }
}
