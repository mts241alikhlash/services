import { RequirePermissions } from '../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../platform/auth/index.js'

import { CreateSemesterDto } from './dto/request/create-semester.dto.js'
import { SemesterQueryDto } from './dto/request/semester-query.dto.js'
import {
  SemesterListResponseDto,
  SemesterResponseDto,
} from './dto/response/semester-response.dto.js'
import { UpdateSemesterDto } from './dto/request/update-semester.dto.js'
import { ActivateSemesterUseCase } from '../../application/use-cases/activate-semester/activate-semester.use-case.js'
import { CreateSemesterUseCase } from '../../application/use-cases/create-semester/create-semester.use-case.js'
import { DeactivateSemesterUseCase } from '../../application/use-cases/deactivate-semester/deactivate-semester.use-case.js'
import { DeleteSemesterUseCase } from '../../application/use-cases/delete-semester/delete-semester.use-case.js'
import { GetSemesterByIdUseCase } from '../../application/use-cases/get-semester-by-id/get-semester-by-id.use-case.js'
import { GetSemestersUseCase } from '../../application/use-cases/get-semesters/get-semesters.use-case.js'
import { UpdateSemesterUseCase } from '../../application/use-cases/update-semester/update-semester.use-case.js'

@ApiTags('Semesters')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('semesters')
export class SemesterController {
  constructor(
    private readonly getSemestersService: GetSemestersUseCase,
    private readonly getSemesterByIdService: GetSemesterByIdUseCase,
    private readonly createSemesterService: CreateSemesterUseCase,
    private readonly updateSemesterService: UpdateSemesterUseCase,
    private readonly deleteSemesterService: DeleteSemesterUseCase,
    private readonly activateSemesterService: ActivateSemesterUseCase,
    private readonly deactivateSemesterService: DeactivateSemesterUseCase,
  ) {}

  @Get()
  @RequirePermissions('semesters.read')
  @ApiOperation({ summary: 'List all semesters (paginated, filterable)' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of semesters',
    type: SemesterListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Query() query: SemesterQueryDto,
  ): Promise<SemesterListResponseDto> {
    const result = await this.getSemestersService.execute({
      page: query.page,
      limit: query.limit,
      search: query.search,
      academicYearId: query.academicYearId,
      isActive: query.isActive,
    })
    return {
      data: result.data.map((semester) =>
        SemesterResponseDto.fromDomain(semester),
      ),
      meta: result.meta,
    }
  }

  @Get(':id')
  @RequirePermissions('semesters.read')
  @ApiOperation({ summary: 'Get a semester by ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Semester details',
    type: SemesterResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Semester not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SemesterResponseDto> {
    const semester = await this.getSemesterByIdService.execute(id)
    return SemesterResponseDto.fromDomain(semester)
  }

  @Patch(':id/activate')
  @RequirePermissions('semesters.update')
  @ApiOperation({ summary: 'Activate a semester (deactivates all others)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Semester activated',
    type: SemesterResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Academic year not active' })
  @ApiResponse({ status: 404, description: 'Semester not found' })
  async activate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SemesterResponseDto> {
    const activated = await this.activateSemesterService.execute(id)
    return SemesterResponseDto.fromDomain(activated)
  }

  @Patch(':id/deactivate')
  @RequirePermissions('semesters.update')
  @ApiOperation({ summary: 'Deactivate a semester' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Semester deactivated',
    type: SemesterResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Semester not found' })
  async deactivate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SemesterResponseDto> {
    const deactivated = await this.deactivateSemesterService.execute(id)
    return SemesterResponseDto.fromDomain(deactivated)
  }

  @Post()
  @RequirePermissions('semesters.create')
  @ApiOperation({ summary: 'Create a new semester' })
  @ApiResponse({
    status: 201,
    description: 'Semester created',
    type: SemesterResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Academic year not found' })
  @ApiResponse({
    status: 409,
    description: 'Semester type already exists for this academic year',
  })
  async create(@Body() dto: CreateSemesterDto): Promise<SemesterResponseDto> {
    const created = await this.createSemesterService.execute({
      academicYearId: dto.academicYearId,
      typeId: dto.typeId,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      isActive: dto.isActive,
    })
    return SemesterResponseDto.fromDomain(created)
  }

  @Patch(':id')
  @RequirePermissions('semesters.update')
  @ApiOperation({ summary: 'Update a semester' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Semester updated',
    type: SemesterResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Semester not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSemesterDto,
  ): Promise<SemesterResponseDto> {
    const updated = await this.updateSemesterService.execute(id, {
      academicYearId: dto.academicYearId,
      typeId: dto.typeId,
      startDate:
        dto.startDate === undefined
          ? undefined
          : dto.startDate
            ? new Date(dto.startDate)
            : null,
      endDate:
        dto.endDate === undefined
          ? undefined
          : dto.endDate
            ? new Date(dto.endDate)
            : null,
    })
    return SemesterResponseDto.fromDomain(updated)
  }

  @Delete(':id')
  @RequirePermissions('semesters.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a semester' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Semester deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Semester not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.deleteSemesterService.execute(id)
  }
}
