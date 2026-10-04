import { RequirePermissions } from '../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import {
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
  Body,
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

import { AcademicYearQueryDto } from './dto/request/academic-year-query.dto.js'
import {
  AcademicYearListResponseDto,
  AcademicYearResponseDto,
} from './dto/response/academic-year-response.dto.js'
import { CreateAcademicYearDto } from './dto/request/create-academic-year.dto.js'
import { UpdateAcademicYearDto } from './dto/request/update-academic-year.dto.js'
import { ActivateAcademicYearUseCase } from '../../application/use-cases/activate-academic-year/activate-academic-year.use-case.js'
import { CreateAcademicYearUseCase } from '../../application/use-cases/create-academic-year/create-academic-year.use-case.js'
import { DeactivateAcademicYearUseCase } from '../../application/use-cases/deactivate-academic-year/deactivate-academic-year.use-case.js'
import { DeleteAcademicYearUseCase } from '../../application/use-cases/delete-academic-year/delete-academic-year.use-case.js'
import { GetAcademicYearByIdUseCase } from '../../application/use-cases/get-academic-year-by-id/get-academic-year-by-id.use-case.js'
import { GetAcademicYearsUseCase } from '../../application/use-cases/get-academic-years/get-academic-years.use-case.js'
import { UpdateAcademicYearUseCase } from '../../application/use-cases/update-academic-year/update-academic-year.use-case.js'

@ApiTags('Academic Years')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('academic-years')
export class AcademicYearController {
  constructor(
    private readonly getAcademicYearsService: GetAcademicYearsUseCase,
    private readonly getAcademicYearByIdService: GetAcademicYearByIdUseCase,
    private readonly createAcademicYearService: CreateAcademicYearUseCase,
    private readonly updateAcademicYearService: UpdateAcademicYearUseCase,
    private readonly deleteAcademicYearService: DeleteAcademicYearUseCase,
    private readonly activateAcademicYearService: ActivateAcademicYearUseCase,
    private readonly deactivateAcademicYearService: DeactivateAcademicYearUseCase,
  ) {}

  @Get()
  @RequirePermissions('academic-years.read')
  @ApiOperation({ summary: 'List all academic years (paginated, searchable)' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of academic years',
    type: AcademicYearListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Query() query: AcademicYearQueryDto,
  ): Promise<AcademicYearListResponseDto> {
    const result = await this.getAcademicYearsService.execute({
      page: query.page,
      limit: query.limit,
      search: query.search,
    })
    return {
      data: result.data.map((year) => AcademicYearResponseDto.fromDomain(year)),
      meta: result.meta,
    }
  }

  @Patch(':id/activate')
  @RequirePermissions('academic-years.update')
  @ApiOperation({
    summary: 'Activate an academic year (deactivates all others)',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Academic year activated',
    type: AcademicYearResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Academic year not found' })
  async activate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AcademicYearResponseDto> {
    const activated = await this.activateAcademicYearService.execute(id)
    return AcademicYearResponseDto.fromDomain(activated)
  }

  @Patch(':id/deactivate')
  @RequirePermissions('academic-years.update')
  @ApiOperation({ summary: 'Deactivate an academic year' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Academic year deactivated',
    type: AcademicYearResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Academic year not found' })
  async deactivate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AcademicYearResponseDto> {
    const deactivated = await this.deactivateAcademicYearService.execute(id)
    return AcademicYearResponseDto.fromDomain(deactivated)
  }

  @Get(':id')
  @RequirePermissions('academic-years.read')
  @ApiOperation({ summary: 'Get an academic year by ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Academic year details',
    type: AcademicYearResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Academic year not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AcademicYearResponseDto> {
    const year = await this.getAcademicYearByIdService.execute(id)
    return AcademicYearResponseDto.fromDomain(year)
  }

  @Post()
  @RequirePermissions('academic-years.create')
  @ApiOperation({ summary: 'Create a new academic year' })
  @ApiResponse({
    status: 201,
    description: 'Academic year created',
    type: AcademicYearResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 409,
    description: 'Academic year name already exists',
  })
  async create(
    @Body() dto: CreateAcademicYearDto,
  ): Promise<AcademicYearResponseDto> {
    const created = await this.createAcademicYearService.execute({
      name: dto.name,
      startYear: dto.startYear,
      isActive: dto.isActive,
    })
    return AcademicYearResponseDto.fromDomain(created)
  }

  @Patch(':id')
  @RequirePermissions('academic-years.update')
  @ApiOperation({ summary: 'Update an academic year' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Academic year updated',
    type: AcademicYearResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Academic year not found' })
  @ApiResponse({
    status: 409,
    description: 'Academic year name already exists',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAcademicYearDto,
  ): Promise<AcademicYearResponseDto> {
    const updated = await this.updateAcademicYearService.execute(id, {
      name: dto.name,
      startYear: dto.startYear,
    })
    return AcademicYearResponseDto.fromDomain(updated)
  }

  @Delete(':id')
  @RequirePermissions('academic-years.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete an academic year' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Academic year deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Academic year not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.deleteAcademicYearService.execute(id)
  }
}
