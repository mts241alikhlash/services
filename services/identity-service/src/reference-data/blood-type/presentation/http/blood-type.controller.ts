import {
  BloodTypeItemResponseDto,
  BloodTypePageResponseDto,
} from './dto/response/blood-type-api-response.dto.js'
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
import { JwtAuthGuard } from '../../../../auth/index.js'
import { RequirePermissions } from '../../../../access-control/permission/decorators/require-permissions.decorator.js'
import { GetBloodTypesUseCase } from '../../application/use-cases/get-blood-types/get-blood-types.use-case.js'
import { GetBloodTypeByIdUseCase } from '../../application/use-cases/get-blood-type-by-id/get-blood-type-by-id.use-case.js'
import { CreateBloodTypeUseCase } from '../../application/use-cases/create-blood-type/create-blood-type.use-case.js'
import { UpdateBloodTypeUseCase } from '../../application/use-cases/update-blood-type/update-blood-type.use-case.js'
import { DeleteBloodTypeUseCase } from '../../application/use-cases/delete-blood-type/delete-blood-type.use-case.js'
import { CreateBloodTypeDto } from './dto/request/create-blood-type.dto.js'
import { UpdateBloodTypeDto } from './dto/request/update-blood-type.dto.js'
import { BloodTypeQueryDto } from './dto/request/blood-type-query.dto.js'

@ApiTags('BloodTypes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('blood-types')
export class BloodTypeController {
  constructor(
    private readonly getBloodTypes: GetBloodTypesUseCase,
    private readonly getBloodTypeById: GetBloodTypeByIdUseCase,
    private readonly createBloodType: CreateBloodTypeUseCase,
    private readonly updateBloodType: UpdateBloodTypeUseCase,
    private readonly deleteBloodType: DeleteBloodTypeUseCase,
  ) {}

  @Get()
  @RequirePermissions('blood-types.read')
  @ApiOperation({ summary: 'List blood-types (paginated, filterable)' })
  @ApiResponse({ status: 200, type: BloodTypePageResponseDto })
  async findAll(
    @Query() query: BloodTypeQueryDto,
  ): Promise<BloodTypePageResponseDto> {
    return BloodTypePageResponseDto.fromDomain(
      await this.getBloodTypes.execute({
        page: query.page,
        limit: query.limit,
        search: query.search,
        isActive: query.isActive,
      }),
    )
  }

  @Get(':id')
  @RequirePermissions('blood-types.read')
  @ApiOperation({ summary: 'Get one blood type' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: BloodTypeItemResponseDto })
  @ApiResponse({ status: 404, description: 'Not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BloodTypeItemResponseDto> {
    return BloodTypeItemResponseDto.fromDomain(
      await this.getBloodTypeById.execute(id),
    )
  }

  @Post()
  @RequirePermissions('blood-types.create')
  @ApiOperation({ summary: 'Create a blood type' })
  @ApiResponse({ status: 201, type: BloodTypeItemResponseDto })
  @ApiResponse({ status: 409, description: 'Name already exists' })
  async create(
    @Body() dto: CreateBloodTypeDto,
  ): Promise<BloodTypeItemResponseDto> {
    return BloodTypeItemResponseDto.fromDomain(
      await this.createBloodType.execute(dto),
    )
  }

  @Patch(':id')
  @RequirePermissions('blood-types.update')
  @ApiOperation({ summary: 'Update a blood type' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: BloodTypeItemResponseDto })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 409, description: 'Name already exists' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBloodTypeDto,
  ): Promise<BloodTypeItemResponseDto> {
    return BloodTypeItemResponseDto.fromDomain(
      await this.updateBloodType.execute(id, dto),
    )
  }

  @Delete(':id')
  @RequirePermissions('blood-types.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a blood type' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 409, description: 'Still recorded on a profile' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.deleteBloodType.execute(id)
  }
}
