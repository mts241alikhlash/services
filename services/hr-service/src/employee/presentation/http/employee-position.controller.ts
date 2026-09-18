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
  ApiQuery,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'

import { JwtAuthGuard } from '../../../platform/auth/index.js'
import { CreateEmployeePositionDto } from './dto/request/create-employee-position.dto.js'
import { UpdateEmployeePositionDto } from './dto/request/update-employee-position.dto.js'
import { EmployeePositionResponseDto } from './dto/response/employee-position-response.dto.js'
import { EmployeePositionUseCase } from '../../application/use-cases/employee-position/employee-position.use-case.js'

@ApiTags('Employee Positions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('employee-positions')
export class EmployeePositionsController {
  constructor(private readonly positionUseCase: EmployeePositionUseCase) {}

  @Get()
  @RequirePermissions('employees.read')
  @ApiOperation({ summary: "Get employee's position assignments" })
  @ApiQuery({ name: 'employeeId', required: true, format: 'uuid' })
  @ApiResponse({ status: 200, type: [EmployeePositionResponseDto] })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async findAll(@Query('employeeId', ParseUUIDPipe) employeeId: string) {
    return this.positionUseCase.findAll(employeeId)
  }

  @Post()
  @RequirePermissions('employees.create')
  @ApiOperation({ summary: 'Assign a position to an employee' })
  @ApiQuery({ name: 'employeeId', required: true, format: 'uuid' })
  @ApiResponse({ status: 201, type: EmployeePositionResponseDto })
  @ApiResponse({ status: 400, description: 'Position is inactive' })
  @ApiResponse({ status: 404, description: 'Employee or position not found' })
  @ApiResponse({
    status: 409,
    description: 'Same position already assigned on that date',
  })
  async assign(
    @Query('employeeId', ParseUUIDPipe) employeeId: string,
    @Body() dto: CreateEmployeePositionDto,
  ) {
    return this.positionUseCase.assign(employeeId, dto)
  }

  @Patch(':id')
  @RequirePermissions('employees.update')
  @ApiOperation({
    summary: 'Update a position assignment (hireDate / isPrimary)',
  })
  @ApiQuery({ name: 'employeeId', required: true, format: 'uuid' })
  @ApiParam({
    name: 'id',
    description: 'EmployeePosition link ID',
    format: 'uuid',
  })
  @ApiResponse({ status: 200, type: EmployeePositionResponseDto })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  async update(
    @Query('employeeId', ParseUUIDPipe) employeeId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmployeePositionDto,
  ) {
    return this.positionUseCase.update(employeeId, id, dto)
  }

  @Delete(':id')
  @RequirePermissions('employees.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a position assignment' })
  @ApiQuery({ name: 'employeeId', required: true, format: 'uuid' })
  @ApiParam({
    name: 'id',
    description: 'EmployeePosition link ID',
    format: 'uuid',
  })
  @ApiResponse({ status: 204, description: 'Assignment removed' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  async remove(
    @Query('employeeId', ParseUUIDPipe) employeeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.positionUseCase.remove(employeeId, id)
  }
}
