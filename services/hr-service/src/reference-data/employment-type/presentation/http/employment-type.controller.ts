import { RequirePermissions } from '../../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
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
import { JwtAuthGuard } from '../../../../platform/auth/index.js'
import { EmploymentTypeQueryDto } from './dto/request/employment-type-query.dto.js'
import {
  EmploymentTypeListResponseDto,
  EmploymentTypeResponseDto,
} from './dto/response/employment-type-response.dto.js'
import { CreateEmploymentTypeDto } from './dto/request/create-employment-type.dto.js'
import { UpdateEmploymentTypeDto } from './dto/request/update-employment-type.dto.js'
import { CreateEmploymentTypeUseCase } from '../../application/use-cases/create-employment-type/create-employment-type.use-case.js'
import { GetEmploymentTypesUseCase } from '../../application/use-cases/get-employment-types/get-employment-types.use-case.js'
import { GetEmploymentTypeByIdUseCase } from '../../application/use-cases/get-employment-type-by-id/get-employment-type-by-id.use-case.js'
import { UpdateEmploymentTypeUseCase } from '../../application/use-cases/update-employment-type/update-employment-type.use-case.js'
import { DeleteEmploymentTypeUseCase } from '../../application/use-cases/delete-employment-type/delete-employment-type.use-case.js'

@ApiTags('Employment Types')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('employment-types')
export class EmploymentTypeController {
  constructor(
    private readonly getEmploymentTypesService: GetEmploymentTypesUseCase,
    private readonly getEmploymentTypeByIdService: GetEmploymentTypeByIdUseCase,
    private readonly createEmploymentTypeService: CreateEmploymentTypeUseCase,
    private readonly updateEmploymentTypeService: UpdateEmploymentTypeUseCase,
    private readonly deleteEmploymentTypeService: DeleteEmploymentTypeUseCase,
  ) {}

  @Get()
  @RequirePermissions('employment-types.read')
  @ApiOperation({
    summary: 'List all employment types (paginated, filterable)',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of employment types',
    type: EmploymentTypeListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Query() query: EmploymentTypeQueryDto) {
    return this.getEmploymentTypesService.execute({
      page: query.page,
      limit: query.limit,
      search: query.search,
    })
  }

  @Get(':id')
  @RequirePermissions('employment-types.read')
  @ApiOperation({ summary: 'Get an employment type by ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Employment type details',
    type: EmploymentTypeResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Employment type not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.getEmploymentTypeByIdService.execute(id)
  }

  @Post()
  @RequirePermissions('employment-types.create')
  @ApiOperation({ summary: 'Create a new employment type' })
  @ApiResponse({
    status: 201,
    description: 'Employment type created',
    type: EmploymentTypeResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 409,
    description: 'Employment type code already exists',
  })
  async create(@Body() dto: CreateEmploymentTypeDto) {
    return this.createEmploymentTypeService.execute({
      code: dto.code,
      name: dto.name,
    })
  }

  @Patch(':id')
  @RequirePermissions('employment-types.update')
  @ApiOperation({ summary: 'Update an employment type' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Employment type updated',
    type: EmploymentTypeResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Employment type not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmploymentTypeDto,
  ) {
    return this.updateEmploymentTypeService.execute(id, {
      name: dto.name,
    })
  }

  @Delete(':id')
  @RequirePermissions('employment-types.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete an employment type' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Employment type deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Employment type not found' })
  @ApiResponse({
    status: 409,
    description: 'Employment type is in use and cannot be deleted',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteEmploymentTypeService.execute(id)
  }
}
