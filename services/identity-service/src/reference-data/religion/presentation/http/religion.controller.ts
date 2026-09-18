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
import { GetReligionsUseCase } from '../../application/use-cases/get-religions/get-religions.use-case.js'
import { GetReligionByIdUseCase } from '../../application/use-cases/get-religion-by-id/get-religion-by-id.use-case.js'
import { CreateReligionUseCase } from '../../application/use-cases/create-religion/create-religion.use-case.js'
import { UpdateReligionUseCase } from '../../application/use-cases/update-religion/update-religion.use-case.js'
import { DeleteReligionUseCase } from '../../application/use-cases/delete-religion/delete-religion.use-case.js'
import { CreateReligionDto } from './dto/request/create-religion.dto.js'
import { UpdateReligionDto } from './dto/request/update-religion.dto.js'
import { ReligionQueryDto } from './dto/request/religion-query.dto.js'
import {
  ReligionListResponseDto,
  ReligionSingleResponseDto,
} from './dto/response/religion-response.dto.js'

@ApiTags('Religions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('religions')
export class ReligionController {
  constructor(
    private readonly getReligions: GetReligionsUseCase,
    private readonly getReligionById: GetReligionByIdUseCase,
    private readonly createReligion: CreateReligionUseCase,
    private readonly updateReligion: UpdateReligionUseCase,
    private readonly deleteReligion: DeleteReligionUseCase,
  ) {}

  @Get()
  @RequirePermissions('religions.read')
  @ApiOperation({ summary: 'List religions (paginated, filterable)' })
  @ApiResponse({ status: 200, type: ReligionListResponseDto })
  async findAll(@Query() query: ReligionQueryDto) {
    return this.getReligions.execute({
      page: query.page,
      limit: query.limit,
      search: query.search,
      isActive: query.isActive,
    })
  }

  @Get(':id')
  @RequirePermissions('religions.read')
  @ApiOperation({ summary: 'Get one religion' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: ReligionSingleResponseDto })
  @ApiResponse({ status: 404, description: 'Not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.getReligionById.execute(id)
  }

  @Post()
  @RequirePermissions('religions.create')
  @ApiOperation({ summary: 'Create a religion' })
  @ApiResponse({ status: 201, type: ReligionSingleResponseDto })
  @ApiResponse({ status: 409, description: 'Name already exists' })
  async create(@Body() dto: CreateReligionDto) {
    return this.createReligion.execute(dto)
  }

  @Patch(':id')
  @RequirePermissions('religions.update')
  @ApiOperation({ summary: 'Update a religion' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: ReligionSingleResponseDto })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 409, description: 'Name already exists' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReligionDto,
  ) {
    return this.updateReligion.execute(id, dto)
  }

  @Delete(':id')
  @RequirePermissions('religions.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a religion' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 409, description: 'Still recorded on a profile' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteReligion.execute(id)
  }
}
