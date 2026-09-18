import { RequirePermissions } from '../../../../access-control/permission/decorators/require-permissions.decorator.js'
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../../auth/index.js'
import { CreateSchoolUnitTypeDto } from './dto/request/create-school-unit-type.dto.js'
import { UpdateSchoolUnitTypeDto } from './dto/request/update-school-unit-type.dto.js'
import {
  DeleteSchoolUnitTypeResponseDto,
  SchoolUnitTypeResponseDto,
} from './dto/response/school-unit-type-response.dto.js'
import { CreateSchoolUnitTypeUseCase } from '../../application/use-cases/create-school-unit-type/create-school-unit-type.use-case.js'
import { UpdateSchoolUnitTypeUseCase } from '../../application/use-cases/update-school-unit-type/update-school-unit-type.use-case.js'
import { DeleteSchoolUnitTypeUseCase } from '../../application/use-cases/delete-school-unit-type/delete-school-unit-type.use-case.js'
import { GetSchoolUnitTypesUseCase } from '../../application/use-cases/get-school-unit-types/get-school-unit-types.use-case.js'
import { GetSchoolUnitTypeByIdUseCase } from '../../application/use-cases/get-school-unit-type-by-id/get-school-unit-type-by-id.use-case.js'

@ApiTags('School Unit Types')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('school-unit-types')
export class SchoolUnitTypeController {
  constructor(
    private readonly getSchoolUnitTypesUseCase: GetSchoolUnitTypesUseCase,
    private readonly getSchoolUnitTypeByIdUseCase: GetSchoolUnitTypeByIdUseCase,
    private readonly createSchoolUnitTypeUseCase: CreateSchoolUnitTypeUseCase,
    private readonly updateSchoolUnitTypeUseCase: UpdateSchoolUnitTypeUseCase,
    private readonly deleteSchoolUnitTypeUseCase: DeleteSchoolUnitTypeUseCase,
  ) {}

  @Get()
  @RequirePermissions('school-units.read')
  @ApiOperation({ summary: 'Get list of school unit types' })
  @ApiResponse({ status: 200, type: [SchoolUnitTypeResponseDto] })
  async findAll() {
    return this.getSchoolUnitTypesUseCase.execute()
  }

  @Get(':id')
  @RequirePermissions('school-units.read')
  @ApiOperation({ summary: 'Get school unit type by id' })
  @ApiResponse({ status: 200, type: SchoolUnitTypeResponseDto })
  async findOne(@Param('id') id: string) {
    return this.getSchoolUnitTypeByIdUseCase.execute(id)
  }

  @Post()
  @RequirePermissions('school-units.create')
  @ApiOperation({ summary: 'Create a new school unit type' })
  @ApiResponse({ status: 201, type: SchoolUnitTypeResponseDto })
  async create(@Body() dto: CreateSchoolUnitTypeDto) {
    return this.createSchoolUnitTypeUseCase.execute(dto)
  }

  @Patch(':id')
  @RequirePermissions('school-units.update')
  @ApiOperation({ summary: 'Update an existing school unit type' })
  @ApiResponse({ status: 200, type: SchoolUnitTypeResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdateSchoolUnitTypeDto) {
    return this.updateSchoolUnitTypeUseCase.execute(id, dto)
  }

  @Delete(':id')
  @RequirePermissions('school-units.update')
  @ApiOperation({ summary: 'Delete a school unit type' })
  @ApiResponse({ status: 200, type: DeleteSchoolUnitTypeResponseDto })
  async remove(@Param('id') id: string) {
    return this.deleteSchoolUnitTypeUseCase.execute(id)
  }
}
