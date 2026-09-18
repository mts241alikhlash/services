import type { UserEntity } from '../../../shared/domain/entities/user.entity.js'
import { RequirePermissions } from '../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseBoolPipe,
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
import type { ProfileEntity } from '../../../platform/profile/domain/entities/profile.entity.js'

import { JwtAuthGuard } from '../../../platform/auth/index.js'

import { UpdateProfileDto } from '../../../platform/profile/index.js'
import { CreateEmployeeDto } from './dto/request/create-employee.dto.js'
import { EmployeeQueryDto } from './dto/request/employee-query.dto.js'
import {
  EmployeeListResponseDto,
  EmployeeResponseDto,
} from './dto/response/employee-response.dto.js'
import { UpdateEmployeeDto } from './dto/request/update-employee.dto.js'
import { CreateEmployeeUseCase } from '../../application/use-cases/create-employee/create-employee.use-case.js'
import { DeleteEmployeeUseCase } from '../../application/use-cases/delete-employee/delete-employee.use-case.js'
import { CurrentUser } from '../../../core/decorators/current-user.decorator.js'
import type { AuthenticatedUser } from '../../../core/types/authenticated-user.type.js'
import { GetMyEmployeeUseCase } from '../../application/use-cases/get-my-employee/get-my-employee.use-case.js'
import { GetEmployeeByIdUseCase } from '../../application/use-cases/get-employee-by-id/get-employee-by-id.use-case.js'
import { GetEmployeesUseCase } from '../../application/use-cases/get-employees/get-employees.use-case.js'
import { ToggleEmployeeActiveUseCase } from '../../application/use-cases/toggle-employee-active/toggle-employee-active.use-case.js'
import { UpdateEmployeeProfileUseCase } from '../../application/use-cases/update-employee-profile/update-employee-profile.use-case.js'
import { UpdateEmployeeUseCase } from '../../application/use-cases/update-employee/update-employee.use-case.js'
import type {
  EmployeeWithDetails,
  EmployeeListWithDetails,
} from '../../domain/repositories/employee.repository.js'
import { PaginatedResponse } from '../../../shared/domain/interfaces/repository.interface.js'

@ApiTags('Employees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('employees')
export class EmployeeController {
  constructor(
    private readonly getEmployeesUseCase: GetEmployeesUseCase,
    private readonly getEmployeeByIdUseCase: GetEmployeeByIdUseCase,
    private readonly getMyEmployeeUseCase: GetMyEmployeeUseCase,
    private readonly createEmployeeUseCase: CreateEmployeeUseCase,
    private readonly updateEmployeeUseCase: UpdateEmployeeUseCase,
    private readonly deleteEmployeeUseCase: DeleteEmployeeUseCase,
    private readonly toggleEmployeeActiveUseCase: ToggleEmployeeActiveUseCase,
    private readonly updateProfileUseCase: UpdateEmployeeProfileUseCase,
  ) {}

  @Get()
  @RequirePermissions('employees.read')
  @ApiOperation({ summary: 'List all employees (paginated, searchable)' })
  @ApiResponse({ status: 200, type: EmployeeListResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Query() query: EmployeeQueryDto,
  ): Promise<PaginatedResponse<EmployeeListWithDetails>> {
    return this.getEmployeesUseCase.execute(query)
  }

  @Get('me')
  @RequirePermissions('employees.read-own')
  @ApiOperation({
    summary: 'Your own employment record — no id parameter exists',
    description:
      'The employment half of a profile screen: employment type, structural ' +
      'positions and hire dates. Who teaches what is academic-service.',
  })
  @ApiResponse({ status: 200, type: EmployeeResponseDto })
  @ApiResponse({ status: 404, description: 'Not linked to an employee record' })
  async findMine(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EmployeeWithDetails> {
    return this.getMyEmployeeUseCase.execute(user.id)
  }

  @Get(':id')
  @RequirePermissions('employees.read')
  @ApiOperation({ summary: 'Get an employee by ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: EmployeeResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EmployeeWithDetails> {
    return this.getEmployeeByIdUseCase.execute(id)
  }

  @Post()
  @RequirePermissions('employees.create')
  @ApiOperation({
    summary: 'Create employee (User + Profile in one transaction)',
  })
  @ApiResponse({ status: 201, type: EmployeeResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 409,
    description: 'Duplicate identifier / NIK / NIP / NUPTK',
  })
  async create(@Body() dto: CreateEmployeeDto): Promise<EmployeeWithDetails> {
    return this.createEmployeeUseCase.execute(dto)
  }

  @Patch(':id')
  @RequirePermissions('employees.update')
  @ApiOperation({
    summary: 'Update employee fields (NIP, NUPTK, employment status)',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: EmployeeResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmployeeDto,
  ): Promise<EmployeeWithDetails> {
    return this.updateEmployeeUseCase.execute(id, dto)
  }

  @Delete(':id')
  @RequirePermissions('employees.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete an employee (also deactivates User)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Employee deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.deleteEmployeeUseCase.execute(id)
  }

  @Patch(':id/profile')
  @RequirePermissions('employees.update')
  @ApiOperation({ summary: "Update employee's profile" })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: EmployeeResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  @ApiResponse({ status: 409, description: 'Duplicate NIK' })
  async updateProfile(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProfileDto,
  ): Promise<ProfileEntity> {
    return this.updateProfileUseCase.execute(id, dto)
  }

  @Patch(':id/toggle-active')
  @RequirePermissions('employees.update')
  @ApiOperation({
    summary: 'Activate or deactivate an employee account (without deleting)',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Account status updated' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async toggleActive(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('isActive', new ParseBoolPipe()) isActive: boolean,
  ): Promise<UserEntity> {
    return this.toggleEmployeeActiveUseCase.execute(id, isActive)
  }
}
