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
import { ParentQueryDto } from './dto/request/parent-query.dto.js'
import { CreateParentDto } from './dto/request/create-parent.dto.js'
import { UpdateParentDto } from './dto/request/update-parent.dto.js'
import {
  ParentListResponseDto,
  ParentResponseDto,
} from './dto/response/parent-response.dto.js'
import { CreateParentUseCase } from '../../application/use-cases/create-parent/create-parent.use-case.js'
import { DeleteParentUseCase } from '../../application/use-cases/delete-parent/delete-parent.use-case.js'
import { GetParentByIdUseCase } from '../../application/use-cases/get-parent-by-id/get-parent-by-id.use-case.js'
import { GetParentsUseCase } from '../../application/use-cases/get-parents/get-parents.use-case.js'
import { UpdateParentUseCase } from '../../application/use-cases/update-parent/update-parent.use-case.js'

@ApiTags('Parents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('parents')
export class ParentController {
  constructor(
    private readonly getParentsService: GetParentsUseCase,
    private readonly getParentByIdService: GetParentByIdUseCase,
    private readonly createParentService: CreateParentUseCase,
    private readonly updateParentService: UpdateParentUseCase,
    private readonly deleteParentService: DeleteParentUseCase,
  ) {}

  @Get()
  @RequirePermissions('parents.read')
  @ApiOperation({ summary: 'List all parents (paginated, filterable)' })
  @ApiResponse({ status: 200, type: ParentListResponseDto })
  async findAll(@Query() query: ParentQueryDto) {
    return this.getParentsService.execute({
      page: query.page,
      limit: query.limit,
      search: query.search,
      occupationId: query.occupationId,
    })
  }

  @Get(':id')
  @RequirePermissions('parents.read')
  @ApiOperation({ summary: 'Get a parent by ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: ParentResponseDto })
  @ApiResponse({ status: 404, description: 'Parent not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.getParentByIdService.execute(id)
  }

  @Post()
  @RequirePermissions('parents.create')
  @ApiOperation({ summary: 'Create a new parent' })
  @ApiResponse({ status: 201, type: ParentResponseDto })
  @ApiResponse({ status: 404, description: 'Occupation not found' })
  @ApiResponse({
    status: 409,
    description: 'Duplicate NIK / inactive occupation',
  })
  async create(@Body() dto: CreateParentDto) {
    return this.createParentService.execute({
      name: dto.name,
      nik: dto.nik,
      birthPlace: dto.birthPlace,
      birthDate: dto.birthDate,
      email: dto.email,
      phone: dto.phone,
      occupationId: dto.occupationId,
      income: dto.income,
    })
  }

  @Patch(':id')
  @RequirePermissions('parents.update')
  @ApiOperation({ summary: 'Update a parent' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: ParentResponseDto })
  @ApiResponse({ status: 404, description: 'Parent or occupation not found' })
  @ApiResponse({
    status: 409,
    description: 'Duplicate NIK / inactive occupation',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateParentDto,
  ) {
    return this.updateParentService.execute(id, {
      name: dto.name,
      nik: dto.nik,
      birthPlace: dto.birthPlace,
      birthDate: dto.birthDate,
      email: dto.email,
      phone: dto.phone,
      occupationId: dto.occupationId,
      income: dto.income,
    })
  }

  @Delete(':id')
  @RequirePermissions('parents.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a parent (soft delete)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Parent deleted' })
  @ApiResponse({ status: 404, description: 'Parent not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteParentService.execute(id)
  }
}
