import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../../core/decorators/current-user.decorator.js'
import type { AuthenticatedUser } from '../../../core/types/authenticated-user.type.js'
import { RequirePermissions } from '../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { JwtAuthGuard } from '../../../platform/auth/index.js'
import { SalaryAssignmentResponseDto } from '../dto/response/salary-assignment.response.dto.js'
import { CreateSalaryAssignmentDto } from '../dto/request/create-salary-assignment.dto.js'
import {
  CreateSalaryAssignmentUseCase,
  DeleteSalaryAssignmentUseCase,
  GetSalaryAssignmentsUseCase,
} from '../use-cases/manage-salary-assignment.use-case.js'

@ApiTags('Payroll — Salary Assignments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payroll/assignments')
export class SalaryAssignmentController {
  constructor(
    private readonly getAll: GetSalaryAssignmentsUseCase,
    private readonly createUC: CreateSalaryAssignmentUseCase,
    private readonly deleteUC: DeleteSalaryAssignmentUseCase,
  ) {}

  @Get()
  @RequirePermissions('payroll-salaries.read')
  async list(
    @Query('userId') userId?: string,
  ): Promise<SalaryAssignmentResponseDto[]> {
    const assignments = await this.getAll.execute(userId)
    return assignments.map((assignment) =>
      SalaryAssignmentResponseDto.fromDomain(assignment),
    )
  }

  @Get('user/:userId')
  @RequirePermissions('payroll-salaries.read')
  @ApiParam({ name: 'userId', format: 'uuid' })
  async forUser(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<SalaryAssignmentResponseDto[]> {
    const assignments = await this.getAll.execute(userId)
    return assignments.map((assignment) =>
      SalaryAssignmentResponseDto.fromDomain(assignment),
    )
  }

  @Post()
  @RequirePermissions('payroll-salaries.update')
  @ApiOperation({
    summary:
      'Set a salary — supersedes rather than overwriting, so an earlier run reproduces',
  })
  async create(
    @Body() dto: CreateSalaryAssignmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SalaryAssignmentResponseDto> {
    return SalaryAssignmentResponseDto.fromDomain(
      await this.createUC.execute(dto, user.id),
    )
  }

  @Delete(':id')
  @RequirePermissions('payroll-salaries.update')
  @ApiParam({ name: 'id', format: 'uuid' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SalaryAssignmentResponseDto> {
    return SalaryAssignmentResponseDto.fromDomain(
      await this.deleteUC.execute(id),
    )
  }
}
